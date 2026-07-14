import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { useAuth } from "@/lib/auth-context";
import { listClients, createClient, updateClient, listConsultores } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — BBC Consórcios" },
      { name: "description", content: "Gerenciamento de clientes da BBC Consórcios." },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  return (
    <AdminLayout>
      <ClientsManager />
    </AdminLayout>
  );
}

function ClientsManager() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const fetchClients = useServerFn(listClients);
  const createClientFn = useServerFn(createClient);
  const updateClientFn = useServerFn(updateClient);
  const fetchConsultores = useServerFn(listConsultores);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    cpf: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "",
    state: "",
    status: "ativo" as "ativo" | "inativo" | "pendente",
    notes: "",
    consultorId: "",
  });

  const { data: clients = [], refetch } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const { data: consultores = [] } = useQuery({
    queryKey: ["consultores"],
    queryFn: fetchConsultores,
    enabled: isAdmin,
  });

  const filtered = clients.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.cpf?.includes(search.replace(/\D/g, ""))
  );

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      // Normaliza campos: strings vazias → undefined (evita erro de validação UUID/e-mail).
      const clean = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, typeof v === "string" && v.trim() === "" ? undefined : v]),
      ) as typeof form;
      if (editing) {
        const { password: _p, ...rest } = clean as typeof form & { password?: string };
        await updateClientFn({ data: { id: editing.id, ...rest } });
      } else {
        if (!clean.password || clean.password.length < 6) {
          throw new Error("A senha deve ter pelo menos 6 caracteres.");
        }
        await createClientFn({ data: clean });
      }
      setOpen(false);
      setEditing(null);
      setForm({ name: "", email: "", password: "", cpf: "", phone: "", whatsapp: "", address: "", city: "", state: "", status: "ativo", notes: "", consultorId: "" });
      refetch();
    } catch (err) {
      console.error("[cadastro-cliente]", err);
      const message = (err as Error)?.message || "";
      if (/duplicate|already registered|already exists|unique/i.test(message)) {
        setFormError("Este e-mail já está cadastrado.");
      } else if (/password/i.test(message)) {
        setFormError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setFormError("Não foi possível concluir o cadastro. Verifique os dados e tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Cadastre, edite e acompanhe seus clientes.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)} className="rounded-full gap-2">
              <Plus className="h-4 w-4" /> Novo cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
              {!editing && (
                <div className="space-y-1.5">
                  <Label>Senha</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>CPF</Label>
                  <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>WhatsApp</Label>
                  <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Endereço</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Cidade</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Estado</Label>
                  <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Consultor</Label>
                  <Select value={form.consultorId} onValueChange={(v) => setForm({ ...form, consultorId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {consultores.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              {formError && (
                <p className="text-sm text-destructive" role="alert">{formError}</p>
              )}
              <Button type="submit" disabled={submitting} className="w-full rounded-full">
                {submitting ? "Salvando..." : editing ? "Salvar" : "Cadastrar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-full"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Consultor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.cpf}</TableCell>
                <TableCell>{c.consultor?.name || "-"}</TableCell>
                <TableCell>
                  <Badge variant={c.status === "ativo" ? "default" : c.status === "pendente" ? "outline" : "secondary"} className="capitalize">
                    {c.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      setEditing(c);
                      setForm({
                        name: c.name || "",
                        email: c.email || "",
                        password: "",
                        cpf: c.cpf || "",
                        phone: c.phone || "",
                        whatsapp: c.whatsapp || "",
                        address: c.address || "",
                        city: c.city || "",
                        state: c.state || "",
                        status: c.status || "ativo",
                        notes: c.notes || "",
                        consultorId: c.consultor_id || "",
                      });
                      setOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
