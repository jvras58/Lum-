import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

vi.mock("@/actions/avaliacoes", () => ({
  saveBatchAvaliacoes: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { GradeEditorClient } from "@/components/avaliacoes/GradeEditorClient"
import { saveBatchAvaliacoes } from "@/actions/avaliacoes"
import { toast } from "sonner"

const mockSave = vi.mocked(saveBatchAvaliacoes)
const mockToast = vi.mocked(toast)

const makeColumn = (id: bigint, nome: string) => ({
  id,
  turmaId: 1n,
  metaId: id,
  ordemExibicao: Number(id),
  ativa: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  meta: {
    id,
    codigo: `M${id}`,
    nome,
    descricao: null,
    ativa: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
})

const makeRow = (id: bigint, nome: string) => ({
  id,
  turmaId: 1n,
  alunoId: id,
  status: "ATIVA",
  matriculadoEm: new Date(),
  desmatriculadoEm: null,
  observacao: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  aluno: {
    id,
    nome,
    cpf: String(id).padStart(11, "0"),
    email: `${nome.toLowerCase()}@test.com`,
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
})

describe("GradeEditorClient", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSave.mockResolvedValue({ success: true, data: { saved: 1 } })
  })

  it("shows empty state message when no columns provided", () => {
    render(
      <GradeEditorClient turmaId={1n} columns={[]} rows={[]} initialAvaliacoes={[]} />
    )
    expect(screen.getByText(/nenhuma meta associada/i)).toBeInTheDocument()
  })

  it("renders grade with aluno names and meta column headers", () => {
    render(
      <GradeEditorClient
        turmaId={1n}
        columns={[makeColumn(1n, "Meta Alfa")]}
        rows={[makeRow(1n, "Alice"), makeRow(2n, "Bruno")]}
        initialAvaliacoes={[]}
      />
    )
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("Bruno")).toBeInTheDocument()
    expect(screen.getByText("Meta Alfa")).toBeInTheDocument()
  })

  it("save button is disabled when no changes are pending", () => {
    render(
      <GradeEditorClient
        turmaId={1n}
        columns={[makeColumn(1n, "Meta 1")]}
        rows={[makeRow(1n, "Alice")]}
        initialAvaliacoes={[]}
      />
    )
    expect(screen.getByRole("button", { name: /salvar/i })).toBeDisabled()
  })

  it("enables save button and shows dirty count after cell change", async () => {
    render(
      <GradeEditorClient
        turmaId={1n}
        columns={[makeColumn(1n, "Meta 1")]}
        rows={[makeRow(1n, "Alice")]}
        initialAvaliacoes={[]}
      />
    )

    const [cellSelect] = screen.getAllByRole("combobox")
    fireEvent.change(cellSelect!, { target: { value: "MANA" } })

    await waitFor(() => {
      expect(screen.getByText(/1 alteração/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /salvar/i })).not.toBeDisabled()
    })
  })

  it("calls saveBatchAvaliacoes with correct args when save is clicked", async () => {
    render(
      <GradeEditorClient
        turmaId={1n}
        columns={[makeColumn(1n, "Meta 1")]}
        rows={[makeRow(1n, "Alice")]}
        initialAvaliacoes={[]}
      />
    )

    const [cellSelect] = screen.getAllByRole("combobox")
    fireEvent.change(cellSelect!, { target: { value: "MPA" } })

    fireEvent.click(screen.getByRole("button", { name: /salvar/i }))

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(
        1n,
        expect.arrayContaining([expect.objectContaining({ conceito: "MPA" })])
      )
    })
  })

  it("shows error toast and keeps dirty state when save fails", async () => {
    mockSave.mockResolvedValue({ success: false, error: "Erro ao salvar avaliações" })

    render(
      <GradeEditorClient
        turmaId={1n}
        columns={[makeColumn(1n, "Meta 1")]}
        rows={[makeRow(1n, "Alice")]}
        initialAvaliacoes={[]}
      />
    )

    const [cellSelect] = screen.getAllByRole("combobox")
    fireEvent.change(cellSelect!, { target: { value: "MA" } })
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }))

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Erro ao salvar avaliações")
    })
    // dirty state preserved after failure
    expect(screen.getByText(/1 alteração/i)).toBeInTheDocument()
  })
})
