import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";

interface SearchResult {
  id: number;
  type: 'claim' | 'task' | 'contact' | 'document';
  title: string;
  description: string;
  date: string;
  status?: string;
}

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Get search query from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get('q');
    if (searchQuery) {
      setQuery(searchQuery);
      performSearch(searchQuery);
    }
  }, []);
  
  // Perform search
  const performSearch = (searchQuery: string) => {
    setLoading(true);
    
    // Mock search results - in a real app, this would call an API
    setTimeout(() => {
      const mockResults: SearchResult[] = [
        {
          id: 1,
          type: 'claim',
          title: `Claim #CLM-10001`,
          description: `Matches search "${searchQuery}" in description`,
          date: '2025-04-15',
          status: 'In Progress'
        },
        {
          id: 2,
          type: 'task',
          title: `Follow up with customer`,
          description: `Task related to search term "${searchQuery}"`,
          date: '2025-04-16',
          status: 'Pending'
        },
        {
          id: 3,
          type: 'document',
          title: `Invoice #INV-2025-123`,
          description: `Document containing "${searchQuery}"`,
          date: '2025-04-10'
        },
        {
          id: 4,
          type: 'contact',
          title: `John Smith`,
          description: `Contact information matching "${searchQuery}"`,
          date: '2025-04-01'
        }
      ];
      
      setResults(mockResults);
      setLoading(false);
    }, 500);
  };
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast({
        title: "Search Error",
        description: "Please enter a search term",
        variant: "destructive"
      });
      return;
    }
    
    // Update URL with search query
    setLocation(`/search?q=${encodeURIComponent(query)}`);
    
    // Perform search
    performSearch(query);
  };
  
  // Filter results by category
  const filteredResults = activeCategory === 'all' 
    ? results 
    : results.filter(result => result.type === activeCategory);

  // Navigate to a result based on its type and id
  const navigateToResult = (result: SearchResult) => {
    switch(result.type) {
      case 'claim':
        setLocation(`/claims/${result.id}`);
        break;
      case 'task':
        setLocation(`/tasks?id=${result.id}`);
        break;
      case 'document':
        setLocation(`/documents?id=${result.id}`);
        break;
      case 'contact':
        setLocation(`/contacts/${result.id}`);
        break;
    }
  };
  
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-medium text-neutral-800">Search Results</h2>
          <p className="text-neutral-500">
            {query ? `Showing results for "${query}"` : 'Enter a search term to get started'}
          </p>
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search claims, contacts, documents..."
              className="w-full px-4 py-2"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button 
              type="submit" 
              className="absolute right-2 top-2 text-neutral-400 bg-transparent border-none cursor-pointer"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
          <Button type="submit">Search</Button>
        </form>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="loader"></div>
            <p className="ml-2">Searching...</p>
          </div>
        ) : (
          <>
            {results.length > 0 ? (
              <div className="space-y-4">
                <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
                  <TabsList>
                    <TabsTrigger value="all">All ({results.length})</TabsTrigger>
                    <TabsTrigger value="claim">Claims ({results.filter(r => r.type === 'claim').length})</TabsTrigger>
                    <TabsTrigger value="task">Tasks ({results.filter(r => r.type === 'task').length})</TabsTrigger>
                    <TabsTrigger value="document">Documents ({results.filter(r => r.type === 'document').length})</TabsTrigger>
                    <TabsTrigger value="contact">Contacts ({results.filter(r => r.type === 'contact').length})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value={activeCategory} className="mt-4">
                    <div className="space-y-4">
                      {filteredResults.map((result) => (
                        <Card key={`${result.type}-${result.id}`} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToResult(result)}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex justify-between">
                              <span>{result.title}</span>
                              {result.status && (
                                <span className={`text-sm px-2 py-1 rounded-full ${
                                  result.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                  result.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                                  result.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {result.status}
                                </span>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-neutral-600 mb-2">{result.description}</p>
                            <div className="flex justify-between items-center text-xs text-neutral-500">
                              <span className="capitalize">{result.type}</span>
                              <span>{result.date}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              query && (
                <div className="text-center py-8">
                  <div className="text-neutral-400 mb-2">
                    <Search className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No results found</h3>
                  <p className="text-neutral-500">
                    We couldn't find any matches for "{query}". Try a different search term.
                  </p>
                </div>
              )
            )}
          </>
        )}
      </div>
    </main>
  );
}