"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/header";
import Clarity from "@/components/Clarity";
import ProductCardMedia, {
  ProductLogo,
} from "@/components/product-card-media";
import { supabase } from "@/lib/supabase";
import {
  getCatalogVisibilitySummary,
  getProductCategoryName,
  getProductTagNames,
  isProductIdVisible,
  isProductVisible,
} from "@/lib/products.mjs";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Code2,
  Compass,
  Megaphone,
  Plus,
  Search,
  Sparkles,
  Workflow,
} from "lucide-react";

const fallbackTools = [
  {
    id: "fallback-1",
    name: "Runway",
    slug: "runway",
    tagline: "Generate and edit video for campaigns, demos, and product stories.",
    category: "Video",
    tags: ["creator", "video"],
  },
  {
    id: "fallback-2",
    name: "Perplexity AI",
    slug: "perplexity-ai",
    tagline: "Research assistant for source-backed answers and market scans.",
    category: "Research",
    tags: ["research", "search"],
  },
  {
    id: "fallback-3",
    name: "Cursor",
    slug: "cursor",
    tagline: "AI-native coding workspace for shipping product changes faster.",
    category: "Developer tools",
    tags: ["code", "agent"],
  },
  {
    id: "fallback-4",
    name: "Gamma",
    slug: "gamma",
    tagline: "Turn notes into polished decks, pages, and shareable documents.",
    category: "Presentations",
    tags: ["slides", "writing"],
  },
  {
    id: "fallback-5",
    name: "Granola",
    slug: "granola",
    tagline: "Meeting notes that turn calls into structured follow-ups.",
    category: "Productivity",
    tags: ["meetings", "notes"],
  },
  {
    id: "fallback-6",
    name: "Lovable",
    slug: "lovable",
    tagline: "Build full web products by describing what you want.",
    category: "Developer tools",
    tags: ["code", "apps"],
  },
];

const fallbackCategories = [
  { id: "all", name: "All tools", slug: "all", count: 432 },
  { id: "developer", name: "Developer", slug: "developer-coding-tools", count: 74 },
  { id: "agents", name: "Agents", slug: "automation-agents", count: 66 },
  { id: "video", name: "Video", slug: "video-animation-tools", count: 38 },
  { id: "writing", name: "Writing", slug: "text-writing-tools", count: 52 },
  { id: "productivity", name: "Productivity", slug: "productivity-workflow-tools", count: 71 },
];

const fallbackStacks = [
  {
    id: "maker-launch",
    name: "Launch a product in a weekend",
    slug: "maker-launch",
    description: "Research the market, build the first version, and package the launch.",
    products: fallbackTools.slice(0, 4),
    owner: "Independent builder",
  },
  {
    id: "content-engine",
    name: "Turn one idea into a week of content",
    slug: "content-engine",
    description: "Research, write, design, and repurpose without losing the original point.",
    products: [fallbackTools[1], fallbackTools[3], fallbackTools[0], fallbackTools[4]],
    owner: "Creator stack",
  },
  {
    id: "product-team",
    name: "A lighter product team workflow",
    slug: "product-team",
    description: "Move from customer insight to prototype and a clear team update.",
    products: [fallbackTools[4], fallbackTools[1], fallbackTools[2], fallbackTools[5]],
    owner: "Product operator",
  },
];

const stackRecipes = [
  {
    id: "ship",
    label: "Ship a product",
    title: "From rough idea to working prototype",
    description:
      "A practical sequence for validating demand, defining the product, building the core flow, and showing it clearly.",
    steps: [
      ["01", "Research the problem", "Perplexity"],
      ["02", "Shape the product", "ChatGPT"],
      ["03", "Build the first version", "Cursor"],
      ["04", "Package the launch", "Runway"],
    ],
  },
  {
    id: "grow",
    label: "Grow pipeline",
    title: "From target account to useful conversation",
    description:
      "Find the right companies, understand their context, create relevant outreach, and preserve every signal.",
    steps: [
      ["01", "Define the market", "Perplexity"],
      ["02", "Build the account list", "Clay"],
      ["03", "Write useful outreach", "Claude"],
      ["04", "Capture the call", "Granola"],
    ],
  },
  {
    id: "operate",
    label: "Run the week",
    title: "From scattered conversations to focused work",
    description:
      "Use AI where it removes coordination cost: notes, decisions, drafts, and repeated handoffs.",
    steps: [
      ["01", "Capture decisions", "Granola"],
      ["02", "Turn notes into plans", "Claude"],
      ["03", "Draft the assets", "Gamma"],
      ["04", "Automate the handoff", "Relay"],
    ],
  },
];

const fallbackUpdates = [
  {
    id: "update-1",
    title: "Coding agents are moving from autocomplete to ownership",
    category: "Developer tools",
    summary: "The useful question is no longer what they can write, but what they can finish.",
  },
  {
    id: "update-2",
    title: "AI search is becoming a workflow layer",
    category: "Research",
    summary: "Answers now lead directly into comparison, synthesis, and action.",
  },
  {
    id: "update-3",
    title: "The best meeting tools disappear into the operating system",
    category: "Productivity",
    summary: "Notes matter when decisions move into the tools where work continues.",
  },
];

const intentFilters = [
  { id: "all", label: "Everything", icon: Compass },
  { id: "developer", label: "Build", icon: Code2 },
  { id: "content", label: "Create", icon: Sparkles },
  { id: "marketing", label: "Grow", icon: Megaphone },
  { id: "productivity", label: "Operate", icon: Workflow },
];

function productHref(product) {
  return product.slug ? `/tool/${product.slug}` : "/explore";
}

function ToolCard({ tool, priority = false }) {
  const category = getProductCategoryName(tool);
  const tags = getProductTagNames(tool).slice(0, 2);

  return (
    <Link
      href={productHref(tool)}
      className="group flex min-w-0 flex-col overflow-hidden rounded-[8px] border border-[#deded9] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#9d9d96] hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2"
    >
      <ProductCardMedia
        product={tool}
        priority={priority}
        className="aspect-[16/10] w-full"
      />

      <div className="flex min-h-[180px] flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-[#777772]">{category}</p>
            <h3 className="mt-1 truncate text-[19px] font-semibold text-[#141414]">
              {tool.name}
            </h3>
          </div>
          <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-[#9c9c96] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#141414]" />
        </div>

        <p className="mt-3 line-clamp-2 text-[14px] leading-6 text-[#666661]">
          {tool.tagline || tool.description || "AI-powered software for modern work."}
        </p>

        <div className="mt-auto flex items-center gap-2 pt-5">
          {(tags.length ? tags : ["New"]).map((tag) => (
            <span
              key={tag}
              className="max-w-[140px] truncate rounded-full bg-[#f1f1ee] px-2.5 py-1 text-[11px] font-medium text-[#5d5d58]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIntent, setActiveIntent] = useState("all");
  const [activeRecipe, setActiveRecipe] = useState(stackRecipes[0]);
  const [tools, setTools] = useState(fallbackTools);
  const [categories, setCategories] = useState(fallbackCategories);
  const [stacks, setStacks] = useState(fallbackStacks);
  const [updates, setUpdates] = useState(fallbackUpdates);
  const [liveCount, setLiveCount] = useState(432);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchHomeData() {
      try {
        const [
          productsRes,
          categoriesRes,
          productCategoriesRes,
          stacksRes,
          blogsRes,
        ] = await Promise.all([
          supabase
            .from("products")
            .select(
              `
                id, name, slug, tagline, description, logo_url, tool_thumbnail_url, tags, created_at,
                company:companies(name, logo_url),
                product_categories:product_category_jnc(
                  category:categories!product_category_jnc_category_id_fkey(id, name, slug)
                ),
                product_tags:product_tags_jnc(
                  tag:tags!product_tags_jnc_tag_id_fkey(id, name, slug)
                )
              `,
              { count: "exact" }
            )
            .order("created_at", { ascending: false })
            .limit(40),
          supabase
            .from("categories")
            .select("id, name, slug")
            .order("name", { ascending: true }),
          supabase
            .from("product_category_jnc")
            .select("product_id, category_id"),
          supabase
            .from("stacks")
            .select(
              `
                id, name, description, slug,
                product_stacks:product_stack_jnc(
                  product:products(
                    id, name, slug, logo_url, tool_thumbnail_url,
                    company:companies(name, logo_url)
                  )
                )
              `
            )
            .order("created_at", { ascending: false })
            .limit(4),
          supabase
            .from("blogs")
            .select("id, title, slug, summary, category, created_at")
            .eq("status", "published")
            .order("created_at", { ascending: false })
            .limit(3),
        ]);

        if (cancelled) return;
        const visibility = getCatalogVisibilitySummary();
        const visibleCount = Math.max(
          0,
          (productsRes.count || productsRes.data?.length || 0) -
            visibility.excluded
        );

        if (!productsRes.error && productsRes.data?.length) {
          setTools(productsRes.data.filter(isProductVisible).slice(0, 18));
          setLiveCount(visibleCount);
          setIsLive(true);
        }

        if (!categoriesRes.error && categoriesRes.data?.length) {
          const counts = {};
          if (!productCategoriesRes.error && productCategoriesRes.data) {
            productCategoriesRes.data.forEach((row) => {
              if (!isProductIdVisible(row.product_id)) return;
              counts[row.category_id] = (counts[row.category_id] || 0) + 1;
            });
          }

          setCategories([
            {
              id: "all",
              name: "All tools",
              slug: "all",
              count: visibleCount,
            },
            ...categoriesRes.data.map((category) => ({
              ...category,
              count: counts[category.id] || 0,
            })),
          ]);
        }

        if (!stacksRes.error && stacksRes.data?.length) {
          setStacks(
            stacksRes.data.map((stack) => ({
              ...stack,
              products: (stack.product_stacks || [])
                .map((item) => item.product)
                .filter(Boolean),
              owner: "UseStack curated",
            }))
          );
        }

        if (!blogsRes.error && blogsRes.data?.length) {
          setUpdates(blogsRes.data);
        }
      } catch (error) {
        console.info("Using homepage fallback content:", error.message);
      }
    }

    fetchHomeData();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tools.filter((tool) => {
      const category = getProductCategoryName(tool).toLowerCase();
      const tags = getProductTagNames(tool).map((tag) => tag.toLowerCase());
      const haystack = [
        tool.name,
        tool.tagline,
        tool.description,
        category,
        ...tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || haystack.includes(query);
      const matchesIntent =
        activeIntent === "all" ||
        category.includes(activeIntent) ||
        tags.some((tag) => tag.includes(activeIntent)) ||
        haystack.includes(activeIntent);

      return matchesSearch && matchesIntent;
    });
  }, [activeIntent, searchQuery, tools]);

  const featuredTools = filteredTools.slice(0, 6);
  const launchRail = tools.slice(0, 5);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    window.location.href = query
      ? `/explore?search=${encodeURIComponent(query)}`
      : "/explore";
  };

  return (
    <div className="min-h-screen bg-white text-[#141414]">
      <Header />
      <Clarity />

      <main>
        <section className="border-b border-[#e3e3df] bg-white">
          <div className="mx-auto max-w-[1440px] px-5 pb-14 pt-16 sm:px-8 sm:pb-16 sm:pt-20 lg:px-12">
            <div className="max-w-5xl">
              <div className="mb-7 flex items-center gap-3 text-[13px] font-medium text-[#666661]">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isLive ? "bg-[#16a34a]" : "bg-[#a3a3a0]"
                  }`}
                />
                Independently curated
                <span className="text-[#c2c2bd]">/</span>
                {liveCount} tools tracked
              </div>

              <h1 className="max-w-4xl text-[44px] font-medium leading-[1.02] tracking-normal text-[#111111] sm:text-[64px] lg:text-[78px]">
                Find the tools that change how you work.
              </h1>

              <p className="mt-7 max-w-2xl text-[17px] leading-7 text-[#62625d] sm:text-[19px] sm:leading-8">
                A considered directory of AI products, recent launches, and
                real stacks used by people building useful things.
              </p>

              <form
                onSubmit={handleSearchSubmit}
                className="mt-10 flex max-w-3xl items-center gap-2 rounded-full border border-[#cfcfca] bg-white p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.05)] transition focus-within:border-[#787873] focus-within:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
              >
                <Search className="ml-3 h-5 w-5 shrink-0 text-[#85857f]" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search tools, tasks, or workflows"
                  aria-label="Search AI tools"
                  className="h-12 min-w-0 flex-1 bg-transparent px-2 text-[16px] text-[#171717] outline-none placeholder:text-[#9b9b95]"
                />
                <button
                  type="submit"
                  className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#171717] px-5 text-[14px] font-medium text-white transition hover:bg-[#333333] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2"
                >
                  Search
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div
                className="mt-5 flex max-w-full gap-1 overflow-x-auto rounded-full bg-[#f1f1ee] p-1 sm:w-fit"
                aria-label="Filter tools by intent"
              >
                {intentFilters.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = activeIntent === filter.id;

                  return (
                    <button
                      key={filter.id}
                      onClick={() => setActiveIntent(filter.id)}
                      className={`inline-flex h-9 min-w-fit items-center gap-2 rounded-full px-3.5 text-[13px] font-medium transition ${
                        isActive
                          ? "bg-white text-[#171717] shadow-sm"
                          : "text-[#6f6f69] hover:text-[#171717]"
                      }`}
                      type="button"
                      aria-pressed={isActive}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f5f5f2] py-16 sm:py-20">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <div className="mb-8 flex items-end justify-between gap-6">
              <div>
                <p className="text-[13px] font-medium text-[#2563eb]">
                  Latest additions
                </p>
                <h2 className="mt-2 text-[32px] font-medium tracking-normal sm:text-[42px]">
                  New to the directory
                </h2>
              </div>
              <Link
                href="/explore"
                className="hidden items-center gap-2 text-[14px] font-medium text-[#3f3f3b] transition hover:text-black sm:inline-flex"
              >
                View all {liveCount}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {featuredTools.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featuredTools.map((tool, index) => (
                  <ToolCard key={tool.id} tool={tool} priority={index < 3} />
                ))}
              </div>
            ) : (
              <div className="border-y border-[#d8d8d3] py-12">
                <p className="text-[20px] font-medium">No matches in the latest set.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveIntent("all");
                  }}
                  className="mt-3 text-[14px] font-medium text-[#2563eb]"
                >
                  Clear search and filters
                </button>
              </div>
            )}

            <Link
              href="/explore"
              className="mt-8 inline-flex items-center gap-2 text-[14px] font-medium text-[#3f3f3b] sm:hidden"
            >
              View all {liveCount}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="border-y border-[#e3e3df] bg-white">
          <div className="mx-auto flex max-w-[1440px] gap-2 overflow-x-auto px-5 py-5 sm:px-8 lg:px-12">
            {categories.slice(0, 9).map((category) => (
              <Link
                key={category.id}
                href={
                  category.slug === "all"
                    ? "/explore"
                    : `/explore?category=${category.slug || category.id}`
                }
                className="inline-flex min-w-fit items-center gap-2 rounded-full border border-[#deded9] bg-white px-4 py-2 text-[13px] font-medium text-[#4f4f4a] transition hover:border-[#969690] hover:bg-[#f5f5f2]"
              >
                {category.name}
                <span className="text-[#a0a09a]">{category.count || 0}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-[#111111] py-20 text-white sm:py-24">
          <div className="mx-auto grid max-w-[1440px] gap-14 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-12">
            <div>
              <p className="text-[13px] font-medium text-[#84a9ff]">
                Builder stacks
              </p>
              <h2 className="mt-3 max-w-xl text-[38px] font-medium leading-tight tracking-normal sm:text-[52px]">
                The tool matters. The sequence matters more.
              </h2>
              <p className="mt-5 max-w-lg text-[16px] leading-7 text-white/60">
                See the workflows people use to move from a question to a
                finished piece of work.
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                {stackRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => setActiveRecipe(recipe)}
                    type="button"
                    className={`rounded-full border px-4 py-2 text-[13px] font-medium transition ${
                      activeRecipe.id === recipe.id
                        ? "border-white bg-white text-black"
                        : "border-white/20 text-white/65 hover:border-white/50 hover:text-white"
                    }`}
                  >
                    {recipe.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/20">
              <div className="py-6">
                <h3 className="text-[27px] font-medium">{activeRecipe.title}</h3>
                <p className="mt-3 max-w-2xl text-[15px] leading-7 text-white/55">
                  {activeRecipe.description}
                </p>
              </div>

              <div>
                {activeRecipe.steps.map(([number, step, tool]) => (
                  <div
                    key={number}
                    className="grid grid-cols-[44px_1fr_auto] items-center gap-4 border-t border-white/15 py-5"
                  >
                    <span className="font-mono text-[12px] text-white/35">
                      {number}
                    </span>
                    <span className="text-[16px] font-medium">{step}</span>
                    <span className="text-[13px] text-white/45">{tool}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/stack"
                className="mt-6 inline-flex items-center gap-2 text-[14px] font-medium text-[#a8c0ff]"
              >
                Explore builder stacks
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <div className="mb-9 flex items-end justify-between gap-6">
              <div>
                <p className="text-[13px] font-medium text-[#16a34a]">
                  Curated workflows
                </p>
                <h2 className="mt-2 text-[32px] font-medium tracking-normal sm:text-[42px]">
                  Popular stacks
                </h2>
              </div>
              <Link
                href="/stack"
                className="hidden items-center gap-2 text-[14px] font-medium sm:inline-flex"
              >
                Browse all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid border-t border-[#dcdcd7] md:grid-cols-3">
              {stacks.slice(0, 3).map((stack, index) => {
                const products = Array.isArray(stack.products)
                  ? stack.products
                  : (stack.product_stacks || [])
                      .map((item) => item.product)
                      .filter(Boolean);
                const visibleProducts = products.filter(isProductVisible);

                return (
                  <Link
                    key={stack.id}
                    href={stack.slug ? `/stack/${stack.slug}` : "/stack"}
                    className={`group flex min-h-[330px] flex-col border-b border-[#dcdcd7] py-7 transition hover:bg-[#fafaf8] md:px-7 ${
                      index < 2 ? "md:border-r" : ""
                    }`}
                  >
                    <div className="flex -space-x-2">
                      {visibleProducts
                        .slice(0, 4)
                        .map((product, productIndex) => {
                        const item =
                          typeof product === "string"
                            ? { name: product }
                            : product;

                        return (
                          <ProductLogo
                            key={`${stack.id}-${item.name}-${productIndex}`}
                            product={item}
                            className="h-10 w-10 rounded-full border-2 border-white shadow-sm"
                            imageClassName="p-1"
                            fallbackClassName="text-[12px]"
                          />
                        );
                        })}
                    </div>

                    <div className="mt-auto">
                      <p className="text-[12px] font-medium text-[#888882]">
                        {stack.owner || "Builder stack"}
                      </p>
                      <h3 className="mt-2 max-w-sm text-[24px] font-medium leading-8">
                        {stack.name}
                      </h3>
                      <p className="mt-3 line-clamp-2 max-w-sm text-[14px] leading-6 text-[#6c6c66]">
                        {stack.description}
                      </p>
                      <span className="mt-6 inline-flex items-center gap-2 text-[13px] font-medium">
                        Open stack
                        <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-[#e3e3df] bg-[#f5f5f2] py-20">
          <div className="mx-auto grid max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.65fr_1.35fr] lg:px-12">
            <div>
              <p className="text-[13px] font-medium text-[#2563eb]">
                Product updates
              </p>
              <h2 className="mt-3 text-[36px] font-medium leading-tight tracking-normal">
                What changed this week.
              </h2>
              <p className="mt-4 max-w-sm text-[15px] leading-7 text-[#6b6b65]">
                Launches, meaningful updates, and shifts worth paying attention to.
              </p>
            </div>

            <div className="border-t border-[#d7d7d2]">
              {updates.map((update) => (
                <Link
                  key={update.id}
                  href={update.slug ? `/blogs/${update.slug}` : "/blogs"}
                  className="group grid gap-3 border-b border-[#d7d7d2] py-6 sm:grid-cols-[150px_1fr_auto]"
                >
                  <span className="text-[12px] font-medium text-[#85857f]">
                    {update.category || "Update"}
                  </span>
                  <div>
                    <h3 className="text-[18px] font-medium leading-7">
                      {update.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[14px] leading-6 text-[#70706a]">
                      {update.summary}
                    </p>
                  </div>
                  <ArrowUpRight className="hidden h-5 w-5 text-[#92928c] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-black sm:block" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-8 px-5 sm:px-8 md:flex-row md:items-end lg:px-12">
            <div>
              <p className="text-[13px] font-medium text-[#16a34a]">
                Community maintained
              </p>
              <h2 className="mt-3 max-w-3xl text-[38px] font-medium leading-tight tracking-normal sm:text-[52px]">
                Know a tool that deserves to be here?
              </h2>
            </div>
            <div className="flex gap-3">
              <Link
                href="/submit-tool"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#171717] px-5 text-[14px] font-medium text-white transition hover:bg-[#333333]"
              >
                <Plus className="h-4 w-4" />
                Submit a tool
              </Link>
              <Link
                href="/newsletter"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#cfcfca] transition hover:border-[#777772]"
                aria-label="Read the UseStack newsletter"
                title="Newsletter"
              >
                <BookOpen className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
