import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
} from "@/components/ui/alert-dialog";
import { CreditCard, Plus, Search, Pencil, Trash2, ListChecks } from "lucide-react";
import { toast } from "sonner";
import {
  listCartas,
  upsertCarta,
  deleteCarta,
  getCarta,
  toggleParcelaPaga,
  calcParcela,
  PRESET_PRAZOS,
} from "@/lib/cartas.functions";
import { listClients } from "@/lib/admin.functions";
import { mapError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/admin/cartas")({
  head: () => ({
    meta: [
      { title: "Cartas — BBC Consórcios" },
      { name: "description", content: "Gestão de cartas de crédito e parcelas mensais." },
    ],
  }),
  component: CartasPage,
});

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmtBRL = (n: number | null | undefined) => (n == null ? "—" : BRL.format(Number(n)));
const fmtDate = (s?: string | null) =>
  s ? new Date(s + "T12:00:00").toLocaleDateString("pt-BR") : "—";

type FormState = {
  id?: string;
  administradora: string;
  grupo: string;
  cota: string;
  versao: string;
  valor_bem: string;
  saldo_devedor: string;
  valores_pagos: string;
  credito_contemplacao: string;
  credito_disponivel: string;
  data_adesao: string;
  data_contemplacao: string;
  previsao_encerramento: string;
  parcelas_totais: number;
  parcelas_pagas: string;
  dia_vencimento: number;
  cliente_id: string;
  situacao: "disponivel" | "reservada" | "vendida";
  descricao: string;
  data_inicio_parcelas: string;
};

const empty: FormState = {
  administradora: "",
  grupo: "",
  cota: "",
  versao: "00",
  valor_bem: "",
  saldo_devedor: "",
  valores_pagos: "0",
  credito_contemplacao: "",
  credito_disponivel: "0",
  data_adesao: "",
  data_contemplacao: "",
  previsao_encerramento: "",
  parcelas_totais: 60,
  parcelas_pagas: "0",
  dia_vencimento: 15,
  cliente_id: "",
  situacao: "disponivel",
  descricao: "",
  data_inicio_parcelas: new Date().toISOString().slice(0, 10),
};

const parseNum = (v: string) => {
  const n = Number(String(v).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

function CartasPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [situacao, setSituacao] = useState<string>("todas");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const listFn = useServerFn(listCartas);
  const listCli = useServerFn(listClients);
  const upsertFn = useServerFn(upsertCarta);
  const delFn = useServerFn(deleteCarta);

  const cartasQ = useQuery({ queryKey: ["cartas"], queryFn: () => listFn() });
  const clientesQ = useQuery({ queryKey: ["clients"], queryFn: () => listCli() });

  const cartas = useMemo(() => {
    const list = (cartasQ.data ?? []) as any[];
    return list.filter((c) => {
      const s = search.trim().toLowerCase();
      const okSearch =
        !s ||
        c.administradora?.toLowerCase().includes(s) ||
        c.grupo?.toLowerCase().includes(s) ||
        c.cota?.toLowerCase().includes(s) ||
        c.cliente?.name?.toLowerCase().includes(s);
      const okSit = situacao === "todas" || c.situacao === situacao;
      return okSearch && okSit;
    });
  }, [cartasQ.data, search, situacao]);

  const saveMut = useMutation({
    mutationFn: (payload: any) => upsertFn({ data: payload }),
    onSuccess: () => {
      toast.success("Carta salva.");
      qc.invalidateQueries({ queryKey: ["cartas"] });
      setOpen(false);
      setForm(empty);
    },
    onError: (e) => toast.error(mapError(e)),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Carta excluída.");
      qc.invalidateQueries({ queryKey: ["cartas"] });
      setConfirmDel(null);
    },
    onError: (e) => toast.error(mapError(e)),
  });

  function openNew() {
    setForm(empty);
    setOpen(true);
  }

  function openEdit(c: any) {
    setForm({
      id: c.id,
      administradora: c.administradora ?? "",
      grupo: c.grupo ?? "",
      cota: c.cota ?? "",
      versao: c.versao ?? "00",
      valor_bem: c.valor_bem ? String(c.valor_bem) : "",
      saldo_devedor: c.saldo_devedor ? String(c.saldo_devedor) : "",
      valores_pagos: String(c.valores_pagos ?? 0),
      credito_contemplacao: c.credito_contemplacao ? String(c.credito_contemplacao) : "",
      credito_disponivel: String(c.credito_disponivel ?? 0),
      data_adesao: c.data_adesao ?? "",
      data_contemplacao: c.data_contemplacao ?? "",
      previsao_encerramento: c.previsao_encerramento ?? "",
      parcelas_totais: c.parcelas_totais ?? c.prazo ?? 60,
      parcelas_pagas: String(c.parcelas_pagas ?? 0),
      dia_vencimento: c.dia_vencimento ?? 15,
      cliente_id: c.cliente_id ?? "",
      situacao: c.situacao ?? "disponivel",
      descricao: c.descricao ?? "",
      data_inicio_parcelas: c.data_adesao ?? new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  }

  function submit() {
    const saldo = parseNum(form.saldo_devedor);
    if (!saldo) return toast.error("Informe o saldo devedor.");
    if (!form.parcelas_totais) return toast.error("Escolha um prazo de parcelamento.");

    saveMut.mutate({
      id: form.id,
      administradora: form.administradora,
      grupo: form.grupo,
      cota: form.cota,
      versao: form.versao || null,
      valor_bem: form.valor_bem ? parseNum(form.valor_bem) : null,
      saldo_devedor: saldo,
      valores_pagos: parseNum(form.valores_pagos),
      credito_contemplacao: form.credito_contemplacao
        ? parseNum(form.credito_contemplacao)
        : null,
      credito_disponivel: parseNum(form.credito_disponivel),
      data_adesao: form.data_adesao || null,
      data_contemplacao: form.data_contemplacao || null,
      previsao_encerramento: form.previsao_encerramento || null,
      parcelas_totais: Number(form.parcelas_totais),
      parcelas_pagas: Number(form.parcelas_pagas) || 0,
      dia_vencimento: Number(form.dia_vencimento) || 15,
      cliente_id: form.cliente_id || null,
      situacao: form.situacao,
      descricao: form.descricao || null,
      taxa_mensal: 0.0012,
      regenerar_parcelas: true,
      data_inicio_parcelas: form.data_inicio_parcelas || null,
    });
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Cartas</h1>
            <p className="text-muted-foreground">
              Cadastro de cartas de crédito e geração automática de parcelas mensais (0,12% a.m.).
            </p>
          </div>
          <Button onClick={openNew} className="rounded-full gap-2">
            <Plus className="h-4 w-4" /> Nova Carta
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por administradora, grupo, cota ou cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full"
            />
          </div>
          <Select value={situacao} onValueChange={setSituacao}>
            <SelectTrigger className="w-[180px] rounded-full">
              <SelectValue />
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
                <TableHead>Cliente</TableHead>
                <TableHead>Saldo devedor</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Parcelas</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cartasQ.isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : cartas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="grid h-14 w-14 place-items-center rounded-full bg-muted">
                        <CreditCard className="h-6 w-6" />
                      </div>
                      <p className="font-medium text-foreground">Nenhuma carta cadastrada</p>
                      <p className="text-sm max-w-sm">
                        Clique em <strong>Nova Carta</strong> para começar.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                cartas.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.administradora}</TableCell>
                    <TableCell>
                      {c.grupo} / {c.cota}
                      {c.versao ? <span className="text-muted-foreground"> · v{c.versao}</span> : null}
                    </TableCell>
                    <TableCell>{c.cliente?.name ?? "—"}</TableCell>
                    <TableCell>{fmtBRL(c.saldo_devedor)}</TableCell>
                    <TableCell>{fmtBRL(c.parcela)}</TableCell>
                    <TableCell>
                      {c.parcelas_pagas ?? 0}/{c.parcelas_totais ?? c.prazo ?? 0}
                    </TableCell>
                    <TableCell className="capitalize">{c.situacao}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                        onClick={() => setDetailId(c.id)}
                        title="Ver parcelas"
                      >
                        <ListChecks className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                        onClick={() => openEdit(c)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="rounded-full"
                        onClick={() => setConfirmDel(c.id)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <CartaFormDialog
          open={open}
          onOpenChange={setOpen}
          form={form}
          setForm={setForm}
          clientes={(clientesQ.data ?? []) as any[]}
          onSubmit={submit}
          saving={saveMut.isPending}
        />

        <ParcelasDialog
          cartaId={detailId}
          onClose={() => setDetailId(null)}
        />

        <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir carta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação remove a carta e todas as parcelas associadas. Não é possível desfazer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => confirmDel && delMut.mutate(confirmDel)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

function CartaFormDialog({
  open,
  onOpenChange,
  form,
  setForm,
  clientes,
  onSubmit,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: FormState;
  setForm: (f: FormState) => void;
  clientes: any[];
  onSubmit: () => void;
  saving: boolean;
}) {
  const saldo = parseNum(form.saldo_devedor);
  const previews = useMemo(
    () =>
      PRESET_PRAZOS.map((n) => ({
        n,
        parcela: calcParcela(saldo, n, 0.0012),
      })),
    [saldo],
  );
  const parcelaAtual = calcParcela(saldo, form.parcelas_totais || 0, 0.0012);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? "Editar carta" : "Nova carta"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Administradora">
              <Input
                value={form.administradora}
                onChange={(e) => setForm({ ...form, administradora: e.target.value })}
              />
            </Field>
            <Field label="Grupo">
              <Input
                value={form.grupo}
                onChange={(e) => setForm({ ...form, grupo: e.target.value })}
              />
            </Field>
            <Field label="Cota">
              <Input
                value={form.cota}
                onChange={(e) => setForm({ ...form, cota: e.target.value })}
              />
            </Field>
            <Field label="Versão">
              <Input
                value={form.versao}
                onChange={(e) => setForm({ ...form, versao: e.target.value })}
              />
            </Field>
            <Field label="Cliente titular">
              <Select
                value={form.cliente_id || "none"}
                onValueChange={(v) => setForm({ ...form, cliente_id: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem vínculo</SelectItem>
                  {clientes.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Situação">
              <Select
                value={form.situacao}
                onValueChange={(v: any) => setForm({ ...form, situacao: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="reservada">Reservada</SelectItem>
                  <SelectItem value="vendida">Vendida</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Valor do bem (R$)">
              <Input
                inputMode="decimal"
                value={form.valor_bem}
                onChange={(e) => setForm({ ...form, valor_bem: e.target.value })}
                placeholder="12380,19"
              />
            </Field>
            <Field label="Saldo devedor (R$) *">
              <Input
                inputMode="decimal"
                value={form.saldo_devedor}
                onChange={(e) => setForm({ ...form, saldo_devedor: e.target.value })}
                placeholder="100000,00"
              />
            </Field>
            <Field label="Valores pagos (R$)">
              <Input
                inputMode="decimal"
                value={form.valores_pagos}
                onChange={(e) => setForm({ ...form, valores_pagos: e.target.value })}
              />
            </Field>
            <Field label="Crédito na contemplação (R$)">
              <Input
                inputMode="decimal"
                value={form.credito_contemplacao}
                onChange={(e) => setForm({ ...form, credito_contemplacao: e.target.value })}
              />
            </Field>
            <Field label="Crédito disponível (R$)">
              <Input
                inputMode="decimal"
                value={form.credito_disponivel}
                onChange={(e) => setForm({ ...form, credito_disponivel: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Data de adesão">
              <Input
                type="date"
                value={form.data_adesao}
                onChange={(e) => setForm({ ...form, data_adesao: e.target.value })}
              />
            </Field>
            <Field label="Data de contemplação">
              <Input
                type="date"
                value={form.data_contemplacao}
                onChange={(e) => setForm({ ...form, data_contemplacao: e.target.value })}
              />
            </Field>
            <Field label="Previsão de encerramento">
              <Input
                type="date"
                value={form.previsao_encerramento}
                onChange={(e) => setForm({ ...form, previsao_encerramento: e.target.value })}
              />
            </Field>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-sm font-medium mb-2">
              Opções de parcelamento (juros 0,12% ao mês)
            </p>
            {saldo > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {previews.map(({ n, parcela }) => {
                  const active = form.parcelas_totais === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm({ ...form, parcelas_totais: n })}
                      className={`rounded-lg border p-3 text-left transition ${
                        active
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="text-xs text-muted-foreground">{n}x</div>
                      <div className="font-semibold">{fmtBRL(parcela)}</div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Informe o saldo devedor para calcular as opções.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Field label="Parcelas totais *">
              <Input
                type="number"
                min={1}
                value={form.parcelas_totais}
                onChange={(e) =>
                  setForm({ ...form, parcelas_totais: Number(e.target.value) || 0 })
                }
              />
            </Field>
            <Field label="Parcelas já pagas">
              <Input
                type="number"
                min={0}
                value={form.parcelas_pagas}
                onChange={(e) => setForm({ ...form, parcelas_pagas: e.target.value })}
              />
            </Field>
            <Field label="Dia do vencimento">
              <Input
                type="number"
                min={1}
                max={31}
                value={form.dia_vencimento}
                onChange={(e) =>
                  setForm({ ...form, dia_vencimento: Number(e.target.value) || 1 })
                }
              />
            </Field>
            <Field label="Início das parcelas">
              <Input
                type="date"
                value={form.data_inicio_parcelas}
                onChange={(e) => setForm({ ...form, data_inicio_parcelas: e.target.value })}
              />
            </Field>
          </div>

          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">
            Parcela calculada: <strong>{fmtBRL(parcelaAtual)}</strong> ·{" "}
            {form.parcelas_totais}x · vencimento todo dia {form.dia_vencimento}
          </div>

          <Field label="Observações">
            <Textarea
              rows={2}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={saving} className="rounded-full">
            {saving ? "Salvando..." : "Salvar e gerar parcelas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ParcelasDialog({
  cartaId,
  onClose,
}: {
  cartaId: string | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const getFn = useServerFn(getCarta);
  const toggleFn = useServerFn(toggleParcelaPaga);

  const q = useQuery({
    queryKey: ["carta", cartaId],
    queryFn: () => getFn({ data: { id: cartaId! } }),
    enabled: !!cartaId,
  });

  const toggle = useMutation({
    mutationFn: (v: { id: string; pago: boolean }) => toggleFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["carta", cartaId] });
      qc.invalidateQueries({ queryKey: ["cartas"] });
    },
    onError: (e) => toast.error(mapError(e)),
  });

  return (
    <Dialog open={!!cartaId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Parcelas {q.data?.carta ? `— Grupo ${q.data.carta.grupo} / Cota ${q.data.carta.cota}` : ""}
          </DialogTitle>
        </DialogHeader>
        {q.isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Carregando...</div>
        ) : !q.data ? null : (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Total: {q.data.parcelas.length} parcelas · Saldo devedor{" "}
              {fmtBRL(q.data.carta.saldo_devedor)}
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {q.data.parcelas.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.numero}</TableCell>
                      <TableCell>{fmtDate(p.vencimento)}</TableCell>
                      <TableCell>{fmtBRL(p.valor)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            p.status === "pago"
                              ? "text-green-600 font-medium"
                              : "text-amber-600 font-medium"
                          }
                        >
                          {p.status === "pago" ? "Pago" : "Pendente"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() =>
                            toggle.mutate({ id: p.id, pago: p.status !== "pago" })
                          }
                        >
                          {p.status === "pago" ? "Marcar pendente" : "Marcar pago"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
