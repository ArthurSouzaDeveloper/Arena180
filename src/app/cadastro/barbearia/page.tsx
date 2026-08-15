import { CadastroForm } from "@/components/cadastro-form";

export default function CadastroBarbeariaPage() {
  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-4 py-16">
      <h1 className="page-title">Cadastro de barbearia</h1>
      <CadastroForm
        tipo="BARBEARIA"
        camposExtras={[
          {
            name: "endereco",
            label: "Endereço do estabelecimento",
            required: true,
          },
          { name: "cnpj", label: "CNPJ (opcional)" },
        ]}
      />
    </main>
  );
}
