import { CadastroForm } from "@/components/cadastro-form";

export default function CadastroBarbeiroPage() {
  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-4 py-16">
      <h1 className="page-title">Cadastro de barbeiro</h1>
      <CadastroForm
        tipo="BARBEIRO"
        camposExtras={[{ name: "cpf", label: "CPF", required: true }]}
      />
    </main>
  );
}
