"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/admin-supabase";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ExternalLink,
  Save,
  X,
  Package,
  Users,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default function AdminStacksPage() {
  const [stacks, setStacks] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStack, setEditingStack] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    used_for: "",
  });

  useEffect(() => {
    fetchStacks();
    fetchProducts();
  }, []);

  const fetchStacks = async () => {
    try {
      const { data, error } = await supabase
        .from("stacks")
        .select(
          `
          id, name, description, created_at,
          product_stacks:product_stack_jnc(
            used_for,
            product:products(
              id, name, slug, tagline
            )
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStacks(data || []);
    } catch (error) {
      setError("Failed to fetch stacks.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, tagline")
        .order("name", { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      setError("Failed to fetch products.");
    }
  };

  // Generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleCreateStack = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      // Generate slug from name
      const slug = generateSlug(formData.name);

      // Create the stack
      const { data: stackData, error: stackError } = await supabase
        .from("stacks")
        .insert({
          name: formData.name.trim(),
          slug: slug,
          description: formData.description.trim(),
          is_public: false, // Default to private
          created_by: 1, // Default admin user ID
        })
        .select()
        .single();

      if (stackError) throw stackError;

      // Add products to the stack if any are selected
      if (selectedProducts.length > 0) {
        const productStackInserts = selectedProducts.map((productId) => {
          const product = products.find((p) => p.id === productId);
          return {
            stack_id: stackData.id,
            product_id: parseInt(productId),
            stack_name: formData.name.trim(),
            product_name: product?.name || "Unknown Product",
            used_for: formData.used_for.trim() || null,
          };
        });

        // Insert product associations
        const { error: junctionError } = await supabase
          .from("product_stack_jnc")
          .insert(productStackInserts);

        if (junctionError) {
          throw junctionError;
        }
      }

      // Reset form and close dialog
      setFormData({ name: "", description: "", used_for: "" });
      setSelectedProducts([]);
      setIsCreateDialogOpen(false);
      fetchStacks();
    } catch (error) {
      setError("Failed to create stack. Please try again.");
    }
  };

  const handleEditStack = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    try {

      // Generate slug from name
      const slug = generateSlug(formData.name);

      // Update the stack
      const { error: stackError } = await supabase
        .from("stacks")
        .update({
          name: formData.name.trim(),
          slug: slug,
          description: formData.description.trim(),
        })
        .eq("id", editingStack.id);

      if (stackError) {
        throw stackError;
      }

      // Remove existing product associations
      const { error: deleteError } = await supabase
        .from("product_stack_jnc")
        .delete()
        .eq("stack_id", editingStack.id);

      if (deleteError) {
        throw deleteError;
      }

      // Add new product associations
      if (selectedProducts.length > 0) {
        const productStackInserts = selectedProducts.map((productId) => {
          const product = products.find((p) => p.id === productId);
          return {
            stack_id: editingStack.id,
            product_id: parseInt(productId),
            stack_name: formData.name.trim(),
            product_name: product?.name || "Unknown Product",
            used_for: formData.used_for.trim() || null,
          };
        });

        // Insert product associations
        const { error: insertError } = await supabase
          .from("product_stack_jnc")
          .insert(productStackInserts);

        if (insertError) {
          throw insertError;
        }
      }

      // Reset form and close dialog
      setFormData({ name: "", description: "", used_for: "" });
      setSelectedProducts([]);
      setEditingStack(null);
      setIsEditDialogOpen(false);
      fetchStacks();
    } catch (error) {
      setError(`Failed to update stack: ${error.message || "Unknown error"}`);
    }
  };

  const handleDeleteStack = async (stackId) => {
    try {
      // Delete product associations first
      const { error: junctionError } = await supabase
        .from("product_stack_jnc")
        .delete()
        .eq("stack_id", stackId);

      if (junctionError) throw junctionError;

      // Delete the stack
      const { error: stackError } = await supabase
        .from("stacks")
        .delete()
        .eq("id", stackId);

      if (stackError) throw stackError;

      fetchStacks();
    } catch (error) {
      setError("Failed to delete stack. Please try again.");
    }
  };

  const openEditDialog = (stack) => {
    setEditingStack(stack);

    // Extract used_for from the first product_stack entry that has it
    const usedForValue = (stack.product_stacks || [])
      .map((ps) => ps.used_for)
      .find((usedFor) => usedFor && usedFor.trim() !== "");

    setFormData({
      name: stack.name,
      description: stack.description,
      used_for: usedForValue || "",
    });

    // Set selected products for editing
    const stackProductIds = (stack.product_stacks || [])
      .map((ps) => ps.product?.id)
      .filter(Boolean)
      .map((id) => parseInt(id)); // Ensure all IDs are integers
    setSelectedProducts(stackProductIds);

    setIsEditDialogOpen(true);
  };

  const toggleProductSelection = (productId) => {
    const productIdInt = parseInt(productId);
    setSelectedProducts((prev) =>
      prev.includes(productIdInt)
        ? prev.filter((id) => id !== productIdInt)
        : [...prev, productIdInt]
    );
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      (product.tagline &&
        product.tagline
          .toLowerCase()
          .includes(productSearchQuery.toLowerCase()))
  );

  const filteredStacks = stacks.filter(
    (stack) =>
      stack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stack.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-4 font-medium hover:text-red-900">&times;</button>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-4 font-medium hover:text-green-900">&times;</button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              AI Stacks Management
            </h1>
            <p className="text-gray-600 mt-2">
              Create and manage curated collections of AI tools and agents
            </p>
          </div>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create New Stack
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New AI Stack</DialogTitle>
                <DialogDescription>
                  Create a curated collection of AI tools for specific use cases
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stack Name *
                  </label>
                  <Input
                    placeholder="e.g., Early Startups, Solopreneur, Business Productivity"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <Textarea
                    placeholder="Describe the target audience and use case for this stack"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Used For
                  </label>
                  <Input
                    placeholder="e.g., Content creation, Data analysis, Customer support"
                    value={formData.used_for}
                    onChange={(e) =>
                      setFormData({ ...formData, used_for: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Products
                  </label>
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search products..."
                        className="pl-10"
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="max-h-80 overflow-y-auto border rounded-lg p-3 space-y-2">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center space-x-3"
                        >
                          <Checkbox
                            id={`product-${product.id}`}
                            checked={selectedProducts.includes(
                              parseInt(product.id)
                            )}
                            onCheckedChange={() =>
                              toggleProductSelection(product.id)
                            }
                          />
                          <label
                            htmlFor={`product-${product.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="font-medium text-sm">
                              {product.name}
                            </div>
                            {product.tagline && (
                              <div className="text-xs text-gray-500">
                                {product.tagline}
                              </div>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setFormData({ name: "", description: "", used_for: "" });
                    setSelectedProducts([]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateStack}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Create Stack
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search stacks..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Stacks Grid */}
        <div className="grid gap-6">
          {filteredStacks.map((stack) => {
            const stackProducts = (stack.product_stacks || [])
              .map((ps) => ps.product)
              .filter(Boolean);

            return (
              <Card
                key={stack.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {stack.name}
                      </CardTitle>
                      <p className="text-gray-600 mb-4">{stack.description}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {stackProducts.length} products
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(stack.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/stack/${stack.id}`}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(stack)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Stack</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{stack.name}"?
                              This action cannot be undone. All product
                              associations will be removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteStack(stack.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {stackProducts.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">
                        Products in this stack:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {stackProducts.map((product) => (
                          <Badge
                            key={product.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {product.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm italic">
                      No products assigned to this stack yet
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredStacks.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No stacks found
            </h3>
            <p className="text-gray-500">
              {searchQuery
                ? "Try adjusting your search criteria"
                : "Create your first AI stack to get started"}
            </p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit AI Stack</DialogTitle>
            <DialogDescription>
              Update the stack details and product assignments
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stack Name *
              </label>
              <Input
                placeholder="e.g., Early Startups, Solopreneur, Business Productivity"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <Textarea
                placeholder="Describe the target audience and use case for this stack"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Used For
              </label>
              <Input
                placeholder="e.g., Content creation, Data analysis, Customer support"
                value={formData.used_for}
                onChange={(e) =>
                  setFormData({ ...formData, used_for: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Products
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search products..."
                    className="pl-10"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                  />
                </div>

                <div className="max-h-80 overflow-y-auto border rounded-lg p-3 space-y-2">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center space-x-3"
                    >
                      <Checkbox
                        id={`edit-product-${product.id}`}
                        checked={selectedProducts.includes(
                          parseInt(product.id)
                        )}
                        onCheckedChange={() =>
                          toggleProductSelection(product.id)
                        }
                      />
                      <label
                        htmlFor={`edit-product-${product.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium text-sm">
                          {product.name}
                        </div>
                        {product.tagline && (
                          <div className="text-xs text-gray-500">
                            {product.tagline}
                          </div>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setFormData({ name: "", description: "", used_for: "" });
                setSelectedProducts([]);
                setEditingStack(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditStack}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Update Stack
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
