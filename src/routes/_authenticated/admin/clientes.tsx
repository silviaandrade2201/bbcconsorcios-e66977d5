import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { listClients, createClient, updateClient, deleteClient } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2 } from "lucide-react";

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

type FormState = {
  name: string;
  cpf: string;
  phone: string;
  password: string;
  status: "ativo" | "inativo" | "pendente";
};

const EMPTY_FORM: FormState = { name: "", cpf: "", phone: "", password: "", status: "ativo" };

function maskCpf(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
}

function ClientsManager() {
  const queryClient = useQueryClient();
  const fetchClients = useServerFn(listClients);
  const createClientFn = useServerFn(createClient);
  const updateClientFn = useServerFn(updateClient);
  const deleteClientFn = useServerFn(deleteClient);

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: clients = [], isLoading, refetch } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const filtered = clients.filter((c: any) => {
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.cpf?.replace(/\D/g, "").includes(search.replace(/\D/g, "")) ||
      c.phone?.includes(search)
    );
  });

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setOpen(true);
  }

  function openEdit(c: any) {
    setEditing(c);
    setForm({
      name: c.name || "",
      cpf: maskCpf(c.cpf || ""),
      phone: maskPhone(c.phone || ""),
      password: "",
      status: c.status || "ativo",
    });
    setFormError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const cpfDigits = form.cpf.replace(/\D/g, "");
    const phoneDigits = form.phone.replace(/\D/g, "");

    if (!form.name.trim()) return setFormError("Informe o nome do cliente.");
    if (cpfDigits.length !== 11) return setFormError("CPF inválido. Informe os 11 dígitos.");
    if (phoneDigits.length < 10) return setFormError("Telefone inválido.");
    if (!editing && form.password.length < 6)
      return setFormError("A senha deve ter pelo menos 6 caracteres.");

    setSubmitting(true);
    try {
      if (editing) {
        await updateClientFn({
          data: {
            id: editing.id,
            name: form.name.trim(),
            cpf: cpfDigits,
            phone: phoneDigits,
            whatsapp: phoneDigits,
            status: form.status,
          },
        });
      } else {
        await createClientFn({
          data: {
            name: form.name.trim(),
            cpf: cpfDigits,
            phone: phoneDigits,
            password: form.password,
            status: form.status,
          },
        });
      }
      setOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      refetch();
    } catch (err) {
      console.error("[cadastro-cliente]", err);
      const message = (err as Error)?.message || "";
      if (/duplicate|already registered|already exists|unique/i.test(message)) {
        setFormError("Já existe um cliente com este CPF ou e-mail.");
      } else if (/password/i.test(message)) {
        setFormError("A senha deve ter pelo menos 6 caracteres.");
      } else if (/forbidden/i.test(message)) {
        setFormError("Você não tem permissão para esta ação.");
      } else {
        setFormError("Não foi possível concluir o cadastro. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteClientFn({ data: { id: confirmDelete.id } });
      setConfirmDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      refetch();
    } catch (err) {
      console.error("[excluir-cliente]", err);
      alert("Não foi possível excluir o cliente. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Aprove cadastros com CPF, nome, telefone e senha.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : (setOpen(false), setEditing(null)))}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="rounded-full gap-2">
              <Plus className="h-4 w-4" /> Novo cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar cliente" : "Aprovar novo cliente"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Nome completo</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>CPF</Label>
                  <Input
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: maskCpf(e.target.value) })}
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    inputMode="tel"
                    required
                  />
                </div>
              </div>
              {!editing && (
                <div className="space-y-1.5">
                  <Label>Senha inicial</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formError && (
                <p className="text-sm text-destructive" role="alert">
                  {formError}
                </p>
              )}
              <Button type="submit" disabled={submitting} className="w-full rounded-full">
                {submitting ? "Salvando..." : editing ? "Salvar alterações" : "Aprovar cadastro"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CPF ou telefone..."
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
              <TableHead>CPF</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Carregando clientes...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{maskCpf(c.cpf || "")}</TableCell>
                <TableCell>{maskPhone(c.phone || "")}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      c.status === "ativo" ? "default" : c.status === "pendente" ? "outline" : "secondary"
                    }
                    className="capitalize"
                  >
                    {c.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => openEdit(c)}>
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-destructive hover:text-destructive"
                    onClick={() => setConfirmDelete(c)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove permanentemente <strong>{confirmDelete?.name}</strong> e o acesso dele à área do
              cliente. Não é possível desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
