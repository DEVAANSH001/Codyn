import { parse } from "@babel/parser";
import traverse, { type NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export type RepositorySymbolKind = "function" | "class" | "interface" | "type" | "enum" | "variable";

export type RepositorySymbol = {
    name: string;
    kind: RepositorySymbolKind;
    exported: boolean;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
};

export type RepositoryImport = {
    source: string;
    importedNames: string[];
    isTypeOnly: boolean;
    line: number;
};

export type RepositoryExport = {
    name: string;
    localName: string | null;
    isDefault: boolean;
    isReExport: boolean;
    line: number;
};

export type ParsedRepositoryFile = {
    symbols: RepositorySymbol[];
    imports: RepositoryImport[];
    exports: RepositoryExport[];
    parseError: string | null;
};

const JAVASCRIPT_TYPESCRIPT_EXTENSIONS = /\.(?:[cm]?[jt]sx?)$/i;

function location(node: t.Node) {
    return {
        startLine: node.loc?.start.line ?? 0,
        startColumn: node.loc?.start.column ?? 0,
        endLine: node.loc?.end.line ?? 0,
        endColumn: node.loc?.end.column ?? 0,
    };
}

function isExported(path: NodePath<t.Node>): boolean {
    return path.parentPath?.isExportNamedDeclaration() || path.parentPath?.isExportDefaultDeclaration() || false;
}

function bindingNames(pattern: t.LVal): string[] {
    if (t.isIdentifier(pattern)) return [pattern.name];
    if (t.isObjectPattern(pattern)) {
        return pattern.properties.flatMap((property) => {
            if (t.isRestElement(property)) return bindingNames(property.argument);
            return t.isObjectProperty(property) ? bindingNames(property.value as t.LVal) : [];
        });
    }
    if (t.isArrayPattern(pattern)) {
        return pattern.elements.flatMap((element) => element ? bindingNames(element as t.LVal) : []);
    }
    if (t.isRestElement(pattern)) return bindingNames(pattern.argument);
    if (t.isAssignmentPattern(pattern)) return bindingNames(pattern.left);
    return [];
}

function addSymbol(
    target: RepositorySymbol[],
    name: string | null | undefined,
    kind: RepositorySymbolKind,
    node: t.Node,
    exported: boolean,
) {
    if (!name) return;
    target.push({ name, kind, exported, ...location(node) });
}

/** Parses a single JavaScript or TypeScript source file without executing it. */
export function parseRepositorySource(path: string, source: string): ParsedRepositoryFile {
    const result: ParsedRepositoryFile = { symbols: [], imports: [], exports: [], parseError: null };
    if (!JAVASCRIPT_TYPESCRIPT_EXTENSIONS.test(path)) {
        return { ...result, parseError: "Only JavaScript and TypeScript files are supported." };
    }

    let ast: t.File;
    try {
        ast = parse(source, {
            sourceType: "unambiguous",
            plugins: ["typescript", "jsx", "classProperties", "decorators-legacy", "dynamicImport"],
        });
    } catch (error) {
        return { ...result, parseError: error instanceof Error ? error.message : "Source could not be parsed." };
    }

    traverse(ast, {
        FunctionDeclaration(symbolPath) {
            addSymbol(result.symbols, symbolPath.node.id?.name, "function", symbolPath.node, isExported(symbolPath));
        },
        ClassDeclaration(symbolPath) {
            addSymbol(result.symbols, symbolPath.node.id?.name, "class", symbolPath.node, isExported(symbolPath));
        },
        TSInterfaceDeclaration(symbolPath) {
            addSymbol(result.symbols, symbolPath.node.id.name, "interface", symbolPath.node, isExported(symbolPath));
        },
        TSTypeAliasDeclaration(symbolPath) {
            addSymbol(result.symbols, symbolPath.node.id.name, "type", symbolPath.node, isExported(symbolPath));
        },
        TSEnumDeclaration(symbolPath) {
            addSymbol(result.symbols, symbolPath.node.id.name, "enum", symbolPath.node, isExported(symbolPath));
        },
        VariableDeclaration(symbolPath) {
            const exported = isExported(symbolPath);
            for (const declaration of symbolPath.node.declarations) {
                const kind: RepositorySymbolKind = declaration.init && (t.isArrowFunctionExpression(declaration.init) || t.isFunctionExpression(declaration.init))
                    ? "function"
                    : "variable";
                for (const name of bindingNames(declaration.id as t.LVal)) {
                    addSymbol(result.symbols, name, kind, declaration, exported);
                }
            }
        },
        ImportDeclaration(importPath) {
            const importedNames = importPath.node.specifiers.map((specifier) => {
                if (t.isImportDefaultSpecifier(specifier)) return "default";
                if (t.isImportNamespaceSpecifier(specifier)) return "*";
                return t.isIdentifier(specifier.imported) ? specifier.imported.name : specifier.imported.value;
            });
            result.imports.push({
                source: importPath.node.source.value,
                importedNames,
                isTypeOnly: importPath.node.importKind === "type" || importPath.node.specifiers.every(
                    (specifier) => t.isImportSpecifier(specifier) && specifier.importKind === "type",
                ),
                line: importPath.node.loc?.start.line ?? 0,
            });
        },
        ExportNamedDeclaration(exportPath) {
            const node = exportPath.node;
            if (node.declaration) return;
            for (const specifier of node.specifiers) {
                if (!t.isExportSpecifier(specifier)) continue;
                const exported = t.isIdentifier(specifier.exported) ? specifier.exported.name : specifier.exported.value;
                const localName = specifier.local.name;
                result.exports.push({
                    name: exported,
                    localName,
                    isDefault: exported === "default",
                    isReExport: Boolean(node.source),
                    line: specifier.loc?.start.line ?? node.loc?.start.line ?? 0,
                });
            }
        },
        ExportDefaultDeclaration(exportPath) {
            const declaration = exportPath.node.declaration;
            const localName = t.isIdentifier(declaration)
                ? declaration.name
                : (t.isFunctionDeclaration(declaration) || t.isClassDeclaration(declaration))
                    ? declaration.id?.name ?? null
                    : null;
            result.exports.push({
                name: "default",
                localName,
                isDefault: true,
                isReExport: false,
                line: exportPath.node.loc?.start.line ?? 0,
            });
        },
    });

    return result;
}
