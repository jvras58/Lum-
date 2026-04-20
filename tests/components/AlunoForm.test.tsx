import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

vi.mock("@/actions/alunos", () => ({
  createAluno: vi.fn(),
  updateAluno: vi.fn(),
  deactivateAluno: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { AlunoForm } from "@/components/alunos/AlunoForm"
import { createAluno } from "@/actions/alunos"
import { toast } from "sonner"

const mockCreate = vi.mocked(createAluno)
const mockToast = vi.mocked(toast)

const VALID_ALUNO = {
  id: 1n,
  nome: "Maria Silva",
  cpf: "12345678901",
  email: "maria@test.com",
  ativo: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("AlunoForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreate.mockResolvedValue({ success: true, data: VALID_ALUNO })
  })

  it("renders nome, cpf, and email fields with submit button", () => {
    render(<AlunoForm />)
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cpf/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /criar aluno/i })).toBeInTheDocument()
  })

  it("shows validation error when CPF has fewer than 11 digits", async () => {
    render(<AlunoForm />)
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: "João" } })
    fireEvent.change(screen.getByLabelText(/cpf/i), { target: { value: "1234" } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "joao@test.com" } })
    fireEvent.click(screen.getByRole("button", { name: /criar aluno/i }))

    await waitFor(() => {
      expect(screen.getByText(/cpf deve ter 11 dígitos numéricos/i)).toBeInTheDocument()
    })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("shows validation error for invalid email", async () => {
    // Use fireEvent.submit on the form to bypass jsdom's HTML5 constraint
    // validation (type="email"), ensuring react-hook-form/Zod runs
    const { container } = render(<AlunoForm />)
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: "João" } })
    fireEvent.change(screen.getByLabelText(/cpf/i), { target: { value: "12345678901" } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "not-an-email" } })
    fireEvent.submit(container.querySelector("form")!)

    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument()
    })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("calls createAluno with normalized form data on valid submit", async () => {
    render(<AlunoForm />)
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: "Maria Silva" } })
    fireEvent.change(screen.getByLabelText(/cpf/i), { target: { value: "12345678901" } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "maria@test.com" } })
    fireEvent.click(screen.getByRole("button", { name: /criar aluno/i }))

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: "Maria Silva",
          cpf: "12345678901",
          email: "maria@test.com",
        })
      )
    })
  })

  it("shows server error message when createAluno returns failure", async () => {
    mockCreate.mockResolvedValue({ success: false, error: "CPF já cadastrado" })

    render(<AlunoForm />)
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: "Test" } })
    fireEvent.change(screen.getByLabelText(/cpf/i), { target: { value: "12345678901" } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "t@test.com" } })
    fireEvent.click(screen.getByRole("button", { name: /criar aluno/i }))

    await waitFor(() => {
      expect(screen.getByText("CPF já cadastrado")).toBeInTheDocument()
    })
    expect(mockToast.error).toHaveBeenCalledWith("CPF já cadastrado")
  })

  it("calls onSuccess callback after successful create", async () => {
    const onSuccess = vi.fn()
    render(<AlunoForm onSuccess={onSuccess} />)
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: "Test" } })
    fireEvent.change(screen.getByLabelText(/cpf/i), { target: { value: "12345678901" } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "t@test.com" } })
    fireEvent.click(screen.getByRole("button", { name: /criar aluno/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
  })
})
