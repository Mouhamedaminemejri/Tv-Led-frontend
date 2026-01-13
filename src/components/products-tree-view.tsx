"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown, Package, Folder, File } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LedProduct } from "@/services/product-service";

interface ProductsTreeViewProps {
    products: LedProduct[];
    currentProductId?: string;
}

interface TreeNode {
    id: string;
    label: string;
    type: 'manufacturer' | 'size' | 'product';
    count?: number;
    children?: TreeNode[];
    product?: LedProduct;
}

export function ProductsTreeView({ products, currentProductId }: ProductsTreeViewProps) {
    // Initialize with all manufacturer nodes expanded by default
    const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(() => {
        const initialSet = new Set<string>();
        // We'll populate this after treeData is created
        return initialSet;
    });

    // Build tree structure: Manufacturer -> Size -> Products
    const treeData = React.useMemo(() => {
        const tree: TreeNode[] = [];
        const manufacturerMap = new Map<string, Map<string, LedProduct[]>>();

        // Group products by manufacturer and size
        products.forEach(product => {
            const manufacturer = product.brand;
            const size = product.size != null && product.size > 0 ? `${product.size}"` : 'Universal';

            if (!manufacturerMap.has(manufacturer)) {
                manufacturerMap.set(manufacturer, new Map());
            }

            const sizeMap = manufacturerMap.get(manufacturer)!;
            if (!sizeMap.has(size)) {
                sizeMap.set(size, []);
            }

            sizeMap.get(size)!.push(product);
        });

        // Build tree structure
        manufacturerMap.forEach((sizeMap, manufacturer) => {
            const manufacturerNode: TreeNode = {
                id: `mfg-${manufacturer}`,
                label: manufacturer,
                type: 'manufacturer',
                count: products.filter(p => p.brand === manufacturer).length,
                children: []
            };

            sizeMap.forEach((productList, size) => {
                const sizeNode: TreeNode = {
                    id: `size-${manufacturer}-${size}`,
                    label: size,
                    type: 'size',
                    count: productList.length,
                    children: productList.map(product => ({
                        id: `product-${product.id}`,
                        label: product.title,
                        type: 'product' as const,
                        product: product
                    }))
                };

                manufacturerNode.children!.push(sizeNode);
            });

            // Sort sizes numerically
            manufacturerNode.children!.sort((a, b) => {
                const aSize = a.label === 'Universal' ? 0 : parseInt(a.label);
                const bSize = b.label === 'Universal' ? 0 : parseInt(b.label);
                return aSize - bSize;
            });

            tree.push(manufacturerNode);
        });

        // Sort manufacturers alphabetically
        tree.sort((a, b) => a.label.localeCompare(b.label));

        return tree;
    }, [products]);

    // Expand all manufacturer nodes by default
    React.useEffect(() => {
        const manufacturerIds = treeData.map(node => node.id);
        setExpandedNodes(new Set(manufacturerIds));
    }, [treeData]);

    const toggleNode = (nodeId: string) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    };

    const expandAll = () => {
        const allIds = new Set<string>();
        const collectIds = (nodes: TreeNode[]) => {
            nodes.forEach(node => {
                if (node.children && node.children.length > 0) {
                    allIds.add(node.id);
                    collectIds(node.children);
                }
            });
        };
        collectIds(treeData);
        setExpandedNodes(allIds);
    };

    const collapseAll = () => {
        setExpandedNodes(new Set());
    };

    const renderNode = (node: TreeNode, level: number = 0): React.ReactNode => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const indent = level * 20;

        if (node.type === 'product' && node.product) {
            const isCurrentProduct = currentProductId === node.product.id;
            return (
                <div
                    key={node.id}
                    className={cn(
                        "flex items-center gap-2 py-1.5 px-2 rounded transition-colors group",
                        isCurrentProduct 
                            ? "bg-blue-500/20 border border-blue-500/50" 
                            : "hover:bg-white/5"
                    )}
                    style={{ paddingLeft: `${indent + 24}px` }}
                >
                    <File className={cn(
                        "h-3 w-3 flex-shrink-0",
                        isCurrentProduct ? "text-blue-400" : "text-gray-500"
                    )} />
                    <Link
                        href={`/leds/${node.product.id}`}
                        className={cn(
                            "flex-1 text-sm transition-colors truncate",
                            isCurrentProduct 
                                ? "text-blue-400 font-semibold" 
                                : "text-gray-300 hover:text-blue-400"
                        )}
                    >
                        {node.label}
                    </Link>
                    <span className={cn(
                        "text-xs",
                        isCurrentProduct ? "text-blue-300" : "text-gray-500 group-hover:text-gray-400"
                    )}>
                        {node.product.price.toFixed(2)} TND
                    </span>
                </div>
            );
        }

        return (
            <div key={node.id}>
                <div
                    className={cn(
                        "flex items-center gap-2 py-2 px-2 hover:bg-white/5 rounded transition-colors cursor-pointer select-none",
                        level === 0 && "font-semibold"
                    )}
                    style={{ paddingLeft: `${indent}px` }}
                    onClick={() => hasChildren && toggleNode(node.id)}
                >
                    {hasChildren ? (
                        isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-blue-400 flex-shrink-0" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        )
                    ) : (
                        <div className="w-4 h-4 flex-shrink-0" />
                    )}
                    
                    {node.type === 'manufacturer' ? (
                        <Folder className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    ) : (
                        <Package className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    )}
                    
                    <span className={cn(
                        "flex-1 text-sm",
                        level === 0 ? "text-white font-bold" : "text-gray-300"
                    )}>
                        {node.label}
                    </span>
                    
                    {node.count !== undefined && (
                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                            {node.count}
                        </span>
                    )}
                </div>
                
                {hasChildren && isExpanded && (
                    <div>
                        {node.children!.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">All Products Tree</h2>
                <div className="flex gap-2">
                    <button
                        onClick={expandAll}
                        className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-white/5 transition-colors"
                    >
                        Expand All
                    </button>
                    <button
                        onClick={collapseAll}
                        className="text-xs text-gray-400 hover:text-gray-300 px-2 py-1 rounded hover:bg-white/5 transition-colors"
                    >
                        Collapse All
                    </button>
                </div>
            </div>
            
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                {treeData.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        No products found
                    </div>
                ) : (
                    <div className="space-y-1">
                        {treeData.map(node => renderNode(node))}
                    </div>
                )}
            </div>
        </div>
    );
}

