import { useState } from "react";
import { useListProducts } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Products() {
  const [search, setSearch] = useState("");
  const { data: products, isLoading } = useListProducts({ search });
  const { toast } = useToast();

  const addToCart = (id: number) => {
    toast({
      title: "CART_UPDATED",
      description: `Product ${id} added to cart.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">PRODUCT_CATALOG</h2>
          <p className="text-muted-foreground">Browse available hardware and software.</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8 bg-card/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="p-0">
                <Skeleton className="h-48 w-full rounded-t-lg rounded-b-none" />
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-full mt-4" />
              </CardContent>
            </Card>
          ))
        ) : products?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            NO_PRODUCTS_FOUND
          </div>
        ) : (
          products?.map((product) => (
            <Card key={product.id} className="bg-card/50 backdrop-blur border-border/50 flex flex-col">
              <CardHeader className="p-0 overflow-hidden bg-muted/20 relative group">
                <div className="h-48 w-full flex items-center justify-center bg-muted/10 border-b border-border/50">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-muted-foreground font-mono">NO_IMAGE_DATA</span>
                  )}
                </div>
                <div className="absolute top-2 right-2 bg-background/80 backdrop-blur px-2 py-1 text-xs font-bold border border-border">
                  ${product.price.toFixed(2)}
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-1">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription className="mt-2 text-xs h-12 overflow-hidden text-ellipsis line-clamp-3">
                  {product.description || "No description provided."}
                </CardDescription>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>CAT: {product.category}</span>
                  <span>STOCK: {product.stock}</span>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button 
                  className="w-full" 
                  onClick={() => addToCart(product.id)}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {product.stock === 0 ? "OUT_OF_STOCK" : "ADD_TO_CART"}
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
