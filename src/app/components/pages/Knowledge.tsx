import { useState } from "react";
import {
  Database,
  Upload,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Download,
  Filter,
} from "lucide-react";
import {
  Button,
  Input,
  Badge,
  Tabs,
  Label,
  TabsContent,
  TabsList,
  TabsTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Progress
} from "@kairosstack/ui";

const documents = [
  {
    id: 1,
    name: "Product Documentation v4.2",
    type: "PDF",
    size: "2.4 MB",
    namespace: "product-docs",
    status: "indexed",
    uploadedBy: "Sarah Chen",
    uploadDate: "2026-04-06",
    vectorized: true,
    chunks: 342,
  },
  {
    id: 2,
    name: "Customer Support FAQ",
    type: "Markdown",
    size: "156 KB",
    namespace: "support-kb",
    status: "indexed",
    uploadedBy: "Emily Watson",
    uploadDate: "2026-04-05",
    vectorized: true,
    chunks: 89,
  },
  {
    id: 3,
    name: "Engineering Runbook",
    type: "PDF",
    size: "1.8 MB",
    namespace: "engineering",
    status: "processing",
    uploadedBy: "James Kim",
    uploadDate: "2026-04-07",
    vectorized: false,
    chunks: 0,
    progress: 67,
  },
  {
    id: 4,
    name: "Sales Playbook 2026",
    type: "DOCX",
    size: "892 KB",
    namespace: "sales",
    status: "indexed",
    uploadedBy: "Anna Kowalski",
    uploadDate: "2026-04-04",
    vectorized: true,
    chunks: 124,
  },
  {
    id: 5,
    name: "API Reference Guide",
    type: "HTML",
    size: "3.1 MB",
    namespace: "engineering",
    status: "queued",
    uploadedBy: "Michael Rodriguez",
    uploadDate: "2026-04-07",
    vectorized: false,
    chunks: 0,
  },
];

const namespaces = [
  {
    id: 1,
    name: "product-docs",
    description: "Product documentation and specifications",
    documentCount: 12,
    totalSize: "8.4 MB",
    scope: "All Divisions",
  },
  {
    id: 2,
    name: "support-kb",
    description: "Customer support knowledge base",
    documentCount: 24,
    totalSize: "4.2 MB",
    scope: "Support Division",
  },
  {
    id: 3,
    name: "engineering",
    description: "Engineering documentation and runbooks",
    documentCount: 18,
    totalSize: "15.7 MB",
    scope: "Engineering",
  },
  {
    id: 4,
    name: "sales",
    description: "Sales materials and playbooks",
    documentCount: 8,
    totalSize: "3.6 MB",
    scope: "Sales Division",
  },
];

const vectorizationQueue = [
  {
    id: 1,
    document: "Engineering Runbook",
    status: "processing",
    progress: 67,
    eta: "2 minutes",
  },
  {
    id: 2,
    document: "API Reference Guide",
    status: "queued",
    progress: 0,
    eta: "5 minutes",
  },
  {
    id: 3,
    document: "Marketing Guidelines",
    status: "queued",
    progress: 0,
    eta: "8 minutes",
  },
];

export function Knowledge() {
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [namespaceDialogOpen, setNamespaceDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Knowledge & Data Ops</h1>
        <p className="text-zinc-600 mt-1">Manage documents, indexes, and retrieval systems</p>
      </div>

      {/* Vectorization Status Banner */}
      {vectorizationQueue.filter(q => q.status === 'processing' || q.status === 'queued').length > 0 && (
        <div className="mb-6 border rounded-lg bg-blue-50 border-blue-200 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900">Vectorization in Progress</h3>
                <p className="text-sm text-blue-700 mt-0.5">
                  {vectorizationQueue.filter(q => q.status === 'processing').length} processing,{' '}
                  {vectorizationQueue.filter(q => q.status === 'queued').length} queued
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              View Queue
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="namespaces">Namespaces</TabsTrigger>
          <TabsTrigger value="vectorization">Vectorization Queue</TabsTrigger>
          <TabsTrigger value="retrieval">Retrieval Test</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search documents..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>

          <div className="border rounded-lg bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Namespace</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Chunks</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-zinc-900">{doc.name}</div>
                          <div className="text-sm text-zinc-500">{doc.type}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {doc.namespace}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-zinc-700">{doc.size}</span>
                    </TableCell>
                    <TableCell>
                      {doc.status === "indexed" ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-700">Indexed</span>
                        </div>
                      ) : doc.status === "processing" ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                            <span className="text-sm text-blue-700">Processing</span>
                          </div>
                          <Progress value={doc.progress} className="h-1.5 w-24" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-amber-600" />
                          <span className="text-sm text-amber-700">Queued</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-zinc-700">
                        {doc.chunks > 0 ? doc.chunks : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm text-zinc-700">{doc.uploadDate}</div>
                        <div className="text-xs text-zinc-500">{doc.uploadedBy}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Metadata
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Re-vectorize
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="namespaces">
          <div className="flex items-center justify-end mb-4">
            <Button onClick={() => setNamespaceDialogOpen(true)}>
              <Database className="h-4 w-4 mr-2" />
              Create Namespace
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {namespaces.map((namespace) => (
              <div key={namespace.id} className="border rounded-lg bg-white p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Database className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">{namespace.name}</h3>
                      <p className="text-sm text-zinc-600 mt-0.5">{namespace.description}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600">Documents</span>
                    <span className="font-medium text-zinc-900">{namespace.documentCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600">Total Size</span>
                    <span className="font-medium text-zinc-900">{namespace.totalSize}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600">Scope</span>
                    <Badge variant="outline" className="text-xs">
                      {namespace.scope}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="vectorization">
          <div className="border rounded-lg bg-white">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-zinc-900">Ingest & Vectorization Status</h3>
              <p className="text-sm text-zinc-600 mt-1">
                Monitor document processing and embedding generation
              </p>
            </div>
            <div className="divide-y">
              {vectorizationQueue.map((item) => (
                <div key={item.id} className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {item.status === "processing" ? (
                        <RefreshCw className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
                      )}
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-900">{item.document}</h4>
                        <p className="text-sm text-zinc-600">
                          {item.status === "processing" ? "Processing..." : "Waiting in queue"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={item.status === "processing" ? "default" : "secondary"}
                      className={item.status === "processing" ? "bg-blue-100 text-blue-800" : ""}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  {item.progress > 0 && (
                    <div className="space-y-1">
                      <Progress value={item.progress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-zinc-600">
                        <span>{item.progress}% complete</span>
                        <span>ETA: {item.eta}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="retrieval">
          <div className="border rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Retrieval Validation Playground</h3>
            <p className="text-sm text-zinc-600 mb-6">
              Test document retrieval and grounding with sample queries
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-query">Test Query</Label>
                <Input
                  id="test-query"
                  placeholder="Enter a test query to validate retrieval..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test-namespace">Namespace</Label>
                <Select>
                  <SelectTrigger id="test-namespace">
                    <SelectValue placeholder="Select namespace" />
                  </SelectTrigger>
                  <SelectContent>
                    {namespaces.map((ns) => (
                      <SelectItem key={ns.id} value={ns.name}>
                        {ns.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setTestDialogOpen(true)}>
                <Search className="h-4 w-4 mr-2" />
                Run Test Query
              </Button>
            </div>

            <div className="mt-6 p-4 bg-zinc-50 rounded-lg">
              <p className="text-sm text-zinc-700">
                Test results will show retrieved chunks, relevance scores, and grounding validation.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Add a new document to your knowledge base.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-zinc-400 mx-auto mb-3" />
              <p className="text-sm text-zinc-700 mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-zinc-500">PDF, DOCX, TXT, Markdown, or HTML</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-namespace">Namespace</Label>
              <Select>
                <SelectTrigger id="doc-namespace">
                  <SelectValue placeholder="Select namespace" />
                </SelectTrigger>
                <SelectContent>
                  {namespaces.map((ns) => (
                    <SelectItem key={ns.id} value={ns.name}>
                      {ns.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setUploadDialogOpen(false)}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Namespace Dialog */}
      <Dialog open={namespaceDialogOpen} onOpenChange={setNamespaceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Namespace</DialogTitle>
            <DialogDescription>
              Create a new namespace for organizing documents.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="namespace-name">Namespace Name</Label>
              <Input id="namespace-name" placeholder="e.g., product-docs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="namespace-description">Description</Label>
              <Input id="namespace-description" placeholder="Describe this namespace..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="namespace-scope">Scope</Label>
              <Select>
                <SelectTrigger id="namespace-scope">
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="sales">Sales Division</SelectItem>
                  <SelectItem value="support">Support Division</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNamespaceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setNamespaceDialogOpen(false)}>Create Namespace</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Results Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Retrieval Test Results</DialogTitle>
            <DialogDescription>
              Top matching chunks and relevance scores
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-zinc-600" />
                    <span className="text-sm font-medium text-zinc-900">
                      Product Documentation v4.2
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Score: 0.{95 - i * 10}
                  </Badge>
                </div>
                <p className="text-sm text-zinc-700">
                  Sample retrieved chunk content showing relevant information from the document...
                </p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
