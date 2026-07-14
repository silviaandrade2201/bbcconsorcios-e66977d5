import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/cartas")({
  head: () => ({
    meta: [
      { title: "Cartas — BBC Consórcios" },
      { name: "description", content: "Gerenciamento de cartas de crédito da BBC Consórcios." },
    ],
  }),
  component: CartasPage,
});

function CartasPage() {
  const [search, setSearch] = useState("");
  const [administradora, setAdministradora] = useState<string>("todas");
  const [situacao, setSituacao] = useState<string>("todas");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string } | null>(null);

  // Estrutura pronta: banco já existe (tabela `cartas`), UI aguardando definição dos campos.
  const cartas: any[] = [];
  const totalPages = 1;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Cartas</h1>
            <p className="text-muted-foreground">
              Modelos de cartas de crédito. Estrutura pronta para cadastro futuro.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="rounded-full gap-2"
          >
            <Plus className="h-4 w-4" /> Nova Carta
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar carta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full"
            />
          </div>
          <Select value={administradora} onValueChange={setAdministradora}>
            <SelectTrigger className="w-[200px] rounded-full">
              <SelectValue placeholder="Administradora" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas administradoras</SelectItem>
            </SelectContent>
          </Select>
          <Select value={situacao} onValueChange={setSituacao}>
            <SelectTrigger className="w-[180px] rounded-full">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas situações</SelectItem>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="reservada">Reservada</SelectItem>
              <SelectItem value="vendida">Vendida</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Administradora</TableHead>
                <TableHead>Grupo / Cota</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cartas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="grid h-14 w-14 place-items-center rounded-full bg-muted">
                        <CreditCard className="h-6 w-6" />
                      </div>
                      <p className="font-medium text-foreground">Nenhuma carta cadastrada</p>
                      <p className="text-sm max-w-sm">
                        Clique em <strong>Nova Carta</strong> para começar. A estrutura do módulo
                        está pronta para receber os campos definitivos.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                cartas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.administradora}</TableCell>
                    <TableCell>{c.grupo} / {c.cota}</TableCell>
                    <TableCell>{c.valor}</TableCell>
                    <TableCell>{c.valor_entrada}</TableCell>
                    <TableCell className="capitalize">{c.situacao}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => {
                          setEditing(c);
                          setOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" className="rounded-full">
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{cartas.length} carta(s)</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar carta" : "Nova carta"}</DialogTitle>
            </DialogHeader>
            <div className="py-6 text-sm text-muted-foreground">
              Os campos da carta serão definidos em uma próxima etapa. A infraestrutura
              (tabela, permissões e endpoints) já está pronta.
            </div>
            <div className="flex justify-end">
              <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
