import { describe, expect, it } from "vitest";
import { gerarHashSenha, verificarSenha } from "./senha";

describe("senha", () => {
  it("gera um hash diferente da senha original", async () => {
    const hash = await gerarHashSenha("minhaSenha123");
    expect(hash).not.toBe("minhaSenha123");
  });

  it("verifica corretamente uma senha válida", async () => {
    const hash = await gerarHashSenha("minhaSenha123");
    await expect(verificarSenha("minhaSenha123", hash)).resolves.toBe(true);
  });

  it("rejeita uma senha incorreta", async () => {
    const hash = await gerarHashSenha("minhaSenha123");
    await expect(verificarSenha("senhaErrada", hash)).resolves.toBe(false);
  });
});
