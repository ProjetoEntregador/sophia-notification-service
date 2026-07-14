import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '@/@types';
import { AiToolInterface } from '@/bot/ai/interfaces/index';
import { FindMedicationByNameUseCase } from '@/medications/application/use-cases/find-medication-by-name.usecase';
import { DeleteMedicationUseCase } from '@/medications/application/use-cases/delete-medication.usecase';
import { EnsureUserByJidUseCase } from '@/users/application/use-cases/ensure-user-by-jid.usecase';

type DeleteMedicationArgs = { name: string };

@Injectable()
export class DeleteMedicationTool extends AiToolInterface {
  readonly definition: AiToolDefinition = {
    name: 'delete_medication',
    description:
      'Apaga permanentemente um medicamento do cadastro do paciente. Use quando o paciente quiser remover um medicamento cadastrado por engano (ex.: typo no nome). NÃO chame sem confirmação explícita do usuário. A ferramenta recusa se houver tratamento ativo usando o medicamento — peça para cancelar o tratamento primeiro.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nome do medicamento a apagar.',
        },
      },
      required: ['name'],
    },
  };

  constructor(
    private readonly findByName: FindMedicationByNameUseCase,
    private readonly deleteMedication: DeleteMedicationUseCase,
    private readonly ensureUser: EnsureUserByJidUseCase,
  ) {
    super();
  }

  async execute(jid: string, args: Record<string, unknown>): Promise<string> {
    const input = args as DeleteMedicationArgs;
    try {
      const user = await this.ensureUser.execute(jid);
      const matches = await this.findByName.execute(input.name, user.id);
      if (matches.length === 0) {
        return `Nenhum medicamento "${input.name}" cadastrado.`;
      }
      if (matches.length > 1) {
        return `Mais de um medicamento corresponde a "${input.name}". Peça ao paciente para ser mais específico antes de chamar a ferramenta de novo.`;
      }
      const medication = matches[0];

      await this.deleteMedication.execute(medication.id);
      return `Medicamento "${medication.name}" apagado.`;
    } catch (err) {
      return `Erro ao apagar medicamento: ${(err as Error).message}`;
    }
  }
}
