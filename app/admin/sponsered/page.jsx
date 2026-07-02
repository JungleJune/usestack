"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/admin-supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Eye, 
  EyeOff, 
  ExternalLink, 
  RefreshCw, 
  Megaphone,
  Building2,
  Package,
  Plus,
  Search,
  X,
  Check,
  Trash2
} from "lucide-react";

export default function AdminAdsPage() {
  const [toolAds, setToolAds] = useState([]);
  const [companyAds, setCompanyAds] = useState([]);
  const [loadingToolAds, setLoadingToolAds] = useState(true);
  const [loadingCompanyAds, setLoadingCompanyAds] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const { toast } = useToast();

  // Add Tool Ad State
  const [showAddToolAd, setShowAddToolAd] = useState(false);
  const [allTools, setAllTools] = useState([]);
  const [toolSearch, setToolSearch] = useState("");
  const [selectedTool, setSelectedTool] = useState(null);
  const [addingToolAd, setAddingToolAd] = useState(false);
  const [showToolDropdown, setShowToolDropdown] = useState(false);
  const toolSearchRef = useRef(null);

  // Add Company Ad State
  const [showAddCompanyAd, setShowAddCompanyAd] = useState(false);
  const [companyAdForm, setCompanyAdForm] = useState({
    company_name: "",
    thumbnail_url: "",
    company_url: "",
    description: "",
  });
  const [addingCompanyAd, setAddingCompanyAd] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchToolAds();
    fetchCompanyAds();
    fetchAllTools();
    // These initial admin queries are intentionally performed once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (toolSearchRef.current && !toolSearchRef.current.contains(event.target)) {
        setShowToolDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch all tools for selection
  const fetchAllTools = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, tagline, tool_thumbnail_url")
        .order("name", { ascending: true });

      if (error) throw error;
      setAllTools(data || []);
    } catch (error) {
      console.error("Error loading tools:", error);
    }
  };

  // Fetch Tool Ads with product details
  const fetchToolAds = async () => {
    try {
      setLoadingToolAds(true);
      const { data, error } = await supabase
        .from("ads")
        .select(`
          id,
          tool_id,
          visibility,
          created_at,
          product:products(id, name, slug, tagline, tool_thumbnail_url, website_url)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setToolAds(data || []);
    } catch (error) {
      console.error("Error loading tool ads:", error);
      toast({
        title: "Error",
        description: "Failed to load tool ads",
        variant: "destructive",
      });
    } finally {
      setLoadingToolAds(false);
    }
  };

  // Fetch Company Ads
  const fetchCompanyAds = async () => {
    try {
      setLoadingCompanyAds(true);
      const { data, error } = await supabase
        .from("company_ads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCompanyAds(data || []);
    } catch (error) {
      console.error("Error loading company ads:", error);
      toast({
        title: "Error",
        description: "Failed to load company ads",
        variant: "destructive",
      });
    } finally {
      setLoadingCompanyAds(false);
    }
  };

  // Add new Tool Ad
  const handleAddToolAd = async () => {
    if (!selectedTool) {
      toast({
        title: "Error",
        description: "Please select a tool",
        variant: "destructive",
      });
      return;
    }

    try {
      setAddingToolAd(true);
      const { error } = await supabase
        .from("ads")
        .insert({
          tool_id: selectedTool.id,
          visibility: true,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Tool ad for "${selectedTool.name}" created successfully`,
      });

      setShowAddToolAd(false);
      setSelectedTool(null);
      setToolSearch("");
      fetchToolAds();
    } catch (error) {
      console.error("Error adding tool ad:", error);
      toast({
        title: "Error",
        description: "Failed to create tool ad",
        variant: "destructive",
      });
    } finally {
      setAddingToolAd(false);
    }
  };

  // Add new Company Ad
  const handleAddCompanyAd = async () => {
    if (!companyAdForm.company_name) {
      toast({
        title: "Error",
        description: "Please enter a company name",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please upload a banner image",
        variant: "destructive",
      });
      return;
    }

    try {
      setAddingCompanyAd(true);

      // Upload image to Supabase storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('label_thumbnails')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('label_thumbnails')
        .getPublicUrl(filePath);

      // Insert company ad with the uploaded image URL
      const { error } = await supabase
        .from("company_ads")
        .insert({
          company_name: companyAdForm.company_name,
          thumbnail_url: publicUrl,
          company_url: companyAdForm.company_url || null,
          description: companyAdForm.description || null,
          visibility: true,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Company ad for "${companyAdForm.company_name}" created successfully`,
      });

      setShowAddCompanyAd(false);
      setCompanyAdForm({
        company_name: "",
        thumbnail_url: "",
        company_url: "",
        description: "",
      });
      setSelectedFile(null);
      setImagePreview(null);
      fetchCompanyAds();
    } catch (error) {
      console.error("Error adding company ad:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create company ad",
        variant: "destructive",
      });
    } finally {
      setAddingCompanyAd(false);
    }
  };

  // Handle image file selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create image preview and check dimensions
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Recommended dimensions for banner: min width 1200px, aspect ratio around 3:1 or 4:1
        const aspectRatio = img.width / img.height;
        
        if (img.width < 1000) {
          toast({
            title: "Warning",
            description: "Image width should be at least 1000px for best quality. Current: " + img.width + "px",
            variant: "destructive",
          });
          return;
        }

        if (aspectRatio < 2.5 || aspectRatio > 5) {
          toast({
            title: "Warning",
            description: `Image aspect ratio should be between 2.5:1 and 5:1 for optimal display. Current: ${aspectRatio.toFixed(2)}:1`,
          });
        }

        setSelectedFile(file);
        setImagePreview(event.target.result);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Toggle Tool Ad Visibility
  const toggleToolAdVisibility = async (ad) => {
    try {
      setTogglingId(`tool-${ad.id}`);
      const newVisibility = !ad.visibility;
      
      const { error } = await supabase
        .from("ads")
        .update({ visibility: newVisibility })
        .eq("id", ad.id);

      if (error) throw error;

      setToolAds(prev => 
        prev.map(a => a.id === ad.id ? { ...a, visibility: newVisibility } : a)
      );

      toast({
        title: "Updated",
        description: `Tool ad visibility set to ${newVisibility ? "visible" : "hidden"}`,
      });
    } catch (error) {
      console.error("Error toggling visibility:", error);
      toast({
        title: "Error",
        description: "Failed to update visibility",
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  };

  // Toggle Company Ad Visibility
  const toggleCompanyAdVisibility = async (ad) => {
    try {
      setTogglingId(`company-${ad.id}`);
      const newVisibility = !ad.visibility;
      
      const { error } = await supabase
        .from("company_ads")
        .update({ visibility: newVisibility })
        .eq("id", ad.id);

      if (error) throw error;

      setCompanyAds(prev => 
        prev.map(a => a.id === ad.id ? { ...a, visibility: newVisibility } : a)
      );

      toast({
        title: "Updated",
        description: `Company ad visibility set to ${newVisibility ? "visible" : "hidden"}`,
      });
    } catch (error) {
      console.error("Error toggling visibility:", error);
      toast({
        title: "Error",
        description: "Failed to update visibility",
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  };

  // Delete Tool Ad
  const handleDeleteToolAd = async (ad) => {
    try {
      setDeletingId(`tool-${ad.id}`);
      
      const { error } = await supabase
        .from("ads")
        .delete()
        .eq("id", ad.id);

      if (error) throw error;

      setToolAds(prev => prev.filter(a => a.id !== ad.id));

      toast({
        title: "Deleted",
        description: `Tool ad for "${ad.product?.name || 'Unknown'}" has been deleted`,
      });
    } catch (error) {
      console.error("Error deleting tool ad:", error);
      toast({
        title: "Error",
        description: "Failed to delete tool ad",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Delete Company Ad
  const handleDeleteCompanyAd = async (ad) => {
    try {
      setDeletingId(`company-${ad.id}`);
      
      // Delete the image from storage if it exists
      if (ad.thumbnail_url) {
        try {
          // Extract filename from URL
          const urlParts = ad.thumbnail_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          
          await supabase.storage
            .from('label_thumbnails')
            .remove([fileName]);
        } catch (storageError) {
          console.error("Error deleting image from storage:", storageError);
          // Continue with deletion even if image removal fails
        }
      }

      const { error } = await supabase
        .from("company_ads")
        .delete()
        .eq("id", ad.id);

      if (error) throw error;

      setCompanyAds(prev => prev.filter(a => a.id !== ad.id));

      toast({
        title: "Deleted",
        description: `Company ad for "${ad.company_name || 'Unknown'}" has been deleted`,
      });
    } catch (error) {
      console.error("Error deleting company ad:", error);
      toast({
        title: "Error",
        description: "Failed to delete company ad",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Filter tools based on search
  const filteredTools = allTools.filter(tool =>
    tool.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
    tool.tagline?.toLowerCase().includes(toolSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-200 to-blue-300 rounded-xl shadow-lg">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Sponsered Tool and Labels</h1>
            <p className="text-gray-500 text-sm">Manage Sponsered Tools and Labels</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="tool-ads" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="tool-ads" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Sponsered Tools ({toolAds.length})
          </TabsTrigger>
          <TabsTrigger value="company-ads" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Sponsered Labels ({companyAds.length})
          </TabsTrigger>
        </TabsList>

        {/* Tool Ads Tab */}
        <TabsContent value="tool-ads" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Sponsored Tool Ads</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={fetchToolAds} disabled={loadingToolAds}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingToolAds ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => setShowAddToolAd(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tool Ad
              </Button>
            </div>
          </div>

          {/* Add Tool Ad Dialog */}
          <Dialog open={showAddToolAd} onOpenChange={setShowAddToolAd}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Tool Ad</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2" ref={toolSearchRef}>
                  <Label>Search & Select Tool</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search for a tool..."
                      value={toolSearch}
                      onChange={(e) => {
                        setToolSearch(e.target.value);
                        setShowToolDropdown(true);
                        if (selectedTool && e.target.value !== selectedTool.name) {
                          setSelectedTool(null);
                        }
                      }}
                      onFocus={() => setShowToolDropdown(true)}
                      className="pl-10"
                    />
                    
                    {/* Tool Dropdown */}
                    {showToolDropdown && toolSearch && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredTools.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500 text-center">
                            No tools found
                          </div>
                        ) : (
                          filteredTools.slice(0, 10).map((tool) => (
                            <div
                              key={tool.id}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                              onClick={() => {
                                setSelectedTool(tool);
                                setToolSearch(tool.name);
                                setShowToolDropdown(false);
                              }}
                            >
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                {tool.tool_thumbnail_url ? (
                                  <img
                                    src={tool.tool_thumbnail_url}
                                    alt={tool.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-grow min-w-0">
                                <p className="font-medium text-sm truncate">{tool.name}</p>
                                <p className="text-xs text-gray-500 truncate">{tool.tagline}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Tool Preview */}
                  {selectedTool && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg mt-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {selectedTool.tool_thumbnail_url ? (
                          <img
                            src={selectedTool.tool_thumbnail_url}
                            alt={selectedTool.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-sm">{selectedTool.name}</p>
                        <p className="text-xs text-gray-500 truncate">{selectedTool.tagline}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTool(null);
                          setToolSearch("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddToolAd(false);
                      setSelectedTool(null);
                      setToolSearch("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddToolAd}
                    disabled={!selectedTool || addingToolAd}
                  >
                    {addingToolAd ? "Adding..." : "Add Tool Ad"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {loadingToolAds ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-20 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : toolAds.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No tool ads found</p>
                <Button className="mt-4" onClick={() => setShowAddToolAd(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Tool Ad
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {toolAds.map((ad) => (
                <Card key={ad.id} className={`overflow-hidden transition-all h-[280px] flex flex-col ${!ad.visibility ? 'opacity-60' : ''}`}>
                  <CardContent className="p-0 flex flex-col h-full">
                    {/* Thumbnail */}
                    <div className="h-28 bg-gray-100 relative flex-shrink-0">
                      {ad.product?.tool_thumbnail_url ? (
                        <img
                          src={ad.product.tool_thumbnail_url}
                          alt={ad.product?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      {/* Visibility Badge */}
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                        ad.visibility 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {ad.visibility ? 'Visible' : 'Hidden'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 flex flex-col flex-grow">
                      <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
                        {ad.product?.name || 'Unknown Tool'}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2 flex-grow">
                        {ad.product?.tagline || 'No description'}
                      </p>
                      
                      <div className="text-xs text-gray-400 mb-2">
                        Created: {new Date(ad.created_at).toLocaleDateString()}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant={ad.visibility ? "outline" : "default"}
                          size="sm"
                          className="flex-1"
                          onClick={() => toggleToolAdVisibility(ad)}
                          disabled={togglingId === `tool-${ad.id}`}
                        >
                          {ad.visibility ? (
                            <>
                              <EyeOff className="w-4 h-4 mr-1" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-1" />
                              Show
                            </>
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              disabled={deletingId === `tool-${ad.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Tool Ad</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the sponsored tool ad for "{ad.product?.name || 'Unknown'}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteToolAd(ad)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        {ad.product?.website_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a href={ad.product.website_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Company Ads Tab */}
        <TabsContent value="company-ads" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Company Banner Ads</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={fetchCompanyAds} disabled={loadingCompanyAds}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingCompanyAds ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => setShowAddCompanyAd(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Company Ad
              </Button>
            </div>
          </div>

          {/* Add Company Ad Dialog */}
          <Dialog open={showAddCompanyAd} onOpenChange={setShowAddCompanyAd}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Company Ad</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      placeholder="Enter company name"
                      value={companyAdForm.company_name}
                      onChange={(e) => setCompanyAdForm(prev => ({ ...prev, company_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_url">Company URL</Label>
                    <Input
                      id="company_url"
                      placeholder="https://example.com"
                      value={companyAdForm.company_url}
                      onChange={(e) => setCompanyAdForm(prev => ({ ...prev, company_url: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner_image">Banner Image * (Min 1000px wide, Aspect ratio 2.5:1 to 5:1)</Label>
                  <Input
                    id="banner_image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-gray-500">
                    Recommended: 1920x480px or similar wide banner format. Max size: 5MB
                  </p>
                  {imagePreview && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter company description..."
                    value={companyAdForm.description}
                    onChange={(e) => setCompanyAdForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddCompanyAd(false);
                      setCompanyAdForm({
                        company_name: "",
                        thumbnail_url: "",
                        company_url: "",
                        description: "",
                      });
                      setSelectedFile(null);
                      setImagePreview(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddCompanyAd}
                    disabled={!companyAdForm.company_name || !selectedFile || addingCompanyAd}
                  >
                    {addingCompanyAd ? "Adding..." : "Add Company Ad"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {loadingCompanyAds ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-32 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : companyAds.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No company ads found</p>
                <Button className="mt-4" onClick={() => setShowAddCompanyAd(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Company Ad
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {companyAds.map((ad) => (
                <Card key={ad.id} className={`overflow-hidden transition-all h-[300px] flex flex-col ${!ad.visibility ? 'opacity-60' : ''}`}>
                  <CardContent className="p-0 flex flex-col h-full">
                    {/* Thumbnail */}
                    <div className="h-28 bg-gray-100 relative flex-shrink-0">
                      {ad.thumbnail_url ? (
                        <img
                          src={ad.thumbnail_url}
                          alt={ad.company_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
                          <Building2 className="w-10 h-10 text-blue-400" />
                        </div>
                      )}
                      {/* Visibility Badge */}
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                        ad.visibility 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {ad.visibility ? 'Visible' : 'Hidden'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 flex flex-col flex-grow">
                      <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
                        {ad.company_name || 'Unknown Company'}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2 flex-grow">
                        {ad.description || 'No description'}
                      </p>
                      
                      {ad.company_url && (
                        <p className="text-xs text-blue-500 truncate mb-1">
                          {ad.company_url}
                        </p>
                      )}

                      <div className="text-xs text-gray-400 mb-2">
                        Created: {new Date(ad.created_at).toLocaleDateString()}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant={ad.visibility ? "outline" : "default"}
                          size="sm"
                          className="flex-1"
                          onClick={() => toggleCompanyAdVisibility(ad)}
                          disabled={togglingId === `company-${ad.id}`}
                        >
                          {ad.visibility ? (
                            <>
                              <EyeOff className="w-4 h-4 mr-1" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-1" />
                              Show
                            </>
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              disabled={deletingId === `company-${ad.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Company Ad</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the sponsored label for "{ad.company_name || 'Unknown'}"? This will also remove the banner image. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCompanyAd(ad)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        {ad.company_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a href={ad.company_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
