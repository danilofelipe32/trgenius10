import { Section } from '../types';

// Estrutura completa para o Estudo Técnico Preliminar (ETP) baseada no modelo oficial.
export const etpSections: Section[] = [
  {
    id: 'etp-1',
    title: '1. Introdução',
    placeholder: 'Apresente uma visão geral da contratação, descrevendo o objeto de forma clara e resumida, o que se pretende alcançar e qual a unidade requisitante. Este ETP estabelece as condições e informações preliminares para a contratação.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Este documento deve conter uma visão geral do que precisa ser contratado, oferecendo condições para análise de sua viabilidade, bem como para verificar, indicar e levantar os elementos essenciais que servirão para compor o Termo de Referência (TR)."
  },
  {
    id: 'etp-2',
    title: '2. Descrição da Necessidade da Contratação',
    placeholder: 'Descreva o problema/demanda a ser resolvido, a justificativa da necessidade da contratação, e os prejuízos que poderiam advir da não contratação. Demonstre o alinhamento com o planejamento estratégico do órgão.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Conforme Art. 18, § 1º, I da Lei 14.133/21. Caracterize o interesse público envolvido, evidenciando o problema a ser resolvido e a sua melhor solução. Este item é obrigatório."
  },
  {
    id: 'etp-3',
    title: '3. Setor Requisitante',
    placeholder: 'Informe o nome do(s) setor(es) que solicitaram a contratação.',
    hasGen: false,
    hasRiskAnalysis: true,
    tooltip: "Identifique a unidade ou unidades que originaram a demanda."
  },
  {
    id: 'etp-4',
    title: '4. Descrição dos Requisitos da Contratação',
    placeholder: 'Liste todos os requisitos que a solução deve atender, incluindo:\n- Requisitos de Negócio da Solução.\n- Requisitos Legais e Normativos.\n- Requisitos Gerais da Solução (aderência a normas, legislações, compromissos ambientais, segurança, etc.).',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Descreva os requisitos indispensáveis para que a solução atenda à demanda, incluindo padrões de qualidade, desempenho, compatibilidade e segurança."
  },
  {
    id: 'etp-5',
    title: '5. Levantamento de Mercado',
    placeholder: 'Descreva a prospecção e análise de mercado, as soluções consideradas (pelo menos duas), e a justificativa para a escolha da solução. Inclua a avaliação comparativa (Benchmarking) com contratações similares e a análise das soluções disponíveis no mercado.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Conforme Art. 18, § 1º, V. Analise as alternativas possíveis, e justifique técnica e economicamente a escolha do tipo de solução a contratar. Avalie custos, benefícios, riscos e impactos de cada alternativa."
  },
  {
    id: 'etp-6',
    title: '6. Descrição da Solução como um Todo',
    placeholder: 'Apresente em linhas gerais as principais características da solução escolhida. Justifique a necessidade de exigência de qualificação técnica e/ou econômico-financeira, se houver.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Conforme Art. 18, § 1º, VII. Descreva a solução escolhida em detalhes, incluindo exigências de manutenção, assistência técnica e garantias, quando for o caso. Este item é obrigatório."
  },
  {
    id: 'etp-7',
    title: '7. Estimativas das Quantidades a Serem Contratadas',
    placeholder: 'Apresente as quantidades a serem contratadas, acompanhadas das memórias de cálculo e dos documentos que lhes dão suporte. Defina o método utilizado para a estimativa.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Conforme Art. 18, § 1º, IV. Justifique as quantidades com base em dados concretos como histórico de consumo, número de usuários, área a ser atendida, etc. Apresente os cálculos de forma clara."
  },
  {
    id: 'etp-8',
    title: '8. Estimativa do Valor da Contratação',
    placeholder: 'Apresente o valor estimado da contratação, detalhando os preços unitários referenciais, as memórias de cálculo e os documentos de suporte (pesquisas de preços, cotações, etc.).',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Conforme Art. 18, § 1º, VI. Detalhe como o valor estimado foi calculado, citando as fontes (Painel de Preços, contratações similares, etc.). Este item é obrigatório."
  },
  {
    id: 'etp-9',
    title: '9. Justificativa para o Parcelamento ou Não da Solução',
    placeholder: 'Justifique a decisão de parcelar ou não o objeto em itens ou lotes, considerando a viabilidade técnica e econômica, a economia de escala e a ampliação da competição.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Conforme Art. 18, § 1º, VIII. A regra geral é o parcelamento. A não adoção deve ser justificada. Este item é obrigatório."
  },
  {
    id: 'etp-10',
    title: '10. Contratações Correlatas e/ou Interdependentes',
    placeholder: 'Informe se existem outras contratações que guardam relação ou dependência com o objeto desta contratação, sejam elas já realizadas ou futuras.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Verifique se a solução a ser contratada depende de outros contratos para funcionar ou se impacta outras contratações existentes."
  },
  {
    id: 'etp-11',
    title: '11. Demonstração do Alinhamento entre a Contratação e o Planejamento',
    placeholder: 'Demonstre como a contratação está alinhada ao Plano de Contratações Anual (PCA), ao Plano Diretor de TI (PDTI), ao Planejamento Estratégico da instituição e a outros instrumentos de planejamento existentes.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Conforme Art. 18, § 1º, II. Vincule a contratação aos objetivos e metas institucionais. Este item é obrigatório."
  },
  {
    id: 'etp-12',
    title: '12. Demonstrativo dos Resultados Pretendidos',
    placeholder: 'Descreva os resultados que se pretende alcançar com a contratação, em termos de economicidade, eficácia, eficiência, melhor aproveitamento de recursos e impacto na qualidade do serviço público.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Conforme Art. 18, § 1º, IX. Apresente os benefícios esperados de forma mensurável, sempre que possível (ex: redução de custos em X%, aumento da produtividade em Y%). Este item é obrigatório."
  },
  {
    id: 'etp-13',
    title: '13. Providências a Serem Adotadas Previamente à Celebração do Contrato',
    placeholder: 'Liste as ações que a Administração precisa realizar antes de assinar o contrato, como adequação de instalações, obtenção de licenças, capacitação de servidores para fiscalização, etc.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Conforme Art. 18, § 1º, X. Mapeie todas as ações preparatórias necessárias para garantir o sucesso da execução contratual."
  },
  {
    id: 'etp-14',
    title: '14. Sustentabilidade Ambiental',
    placeholder: 'Descreva os possíveis impactos ambientais da contratação e as medidas de tratamento ou mitigação. Indique se serão exigidos critérios de sustentabilidade na especificação do objeto ou como obrigação do contratado.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Conforme Art. 18, § 1º, XII. Avalie aspectos como consumo de energia, geração de resíduos, logística reversa e conformidade com as normas ambientais."
  },
  {
    id: 'etp-15',
    title: '15. Declaração da Viabilidade da Contratação',
    placeholder: 'Apresente o posicionamento conclusivo sobre a viabilidade e a razoabilidade da contratação, com base em toda a análise realizada neste ETP.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Conforme Art. 18, § 1º, XIII. Declare formalmente se, após todas as análises, a contratação é considerada viável, inviável ou se depende de alguma condição. Este item é obrigatório."
  }
];

// Estrutura completa para o Termo de Referência (TR) baseada no modelo oficial (10.2).
export const trSections: Section[] = [
  { 
    id: 'tr-1', 
    title: '1. Objeto', 
    placeholder: 'Descreva aqui, de forma detalhada:\n- 1.1 A descrição resumida dos serviços.\n- 1.2 Os quantitativos pretendidos.\n- 1.3 O regime de execução adotado (Ex: Empreitada por Preço Unitário/Global, etc.).\n- 1.4 A justificativa para a adoção do regime de execução.\n- Confirmação de que não há geração de vínculo empregatício.',
    hasGen: true, 
    hasRiskAnalysis: true,
    tooltip: "Conforme Art. 6º, XXIII, 'a' da Lei 14.133/21. Defina o objeto de forma precisa, suficiente e clara, vedadas especificações excessivas ou irrelevantes. Inclua a natureza, os quantitativos e o prazo do contrato."
  },
  { 
    id: 'tr-2', 
    title: '2. Justificativa da Contratação', 
    placeholder: 'Apresente a síntese da justificativa para a contratação, demonstrando a necessidade do objeto. Referencie o Estudo Técnico Preliminar (ETP) que fundamenta este Termo de Referência.',
    hasGen: true, 
    hasRiskAnalysis: true,
    tooltip: "Conforme Art. 6º, XXIII, 'b' da Lei 14.133/21. A justificativa deve ser clara, precisa e suficiente, sendo vedadas justificativas genéricas. Deve ter como base o ETP."
  },
  {
    id: 'tr-3',
    title: '3. Natureza do Objeto',
    placeholder: 'Descreva se os serviços/bens possuem padrões de desempenho e qualidade que podem ser objetivamente definidos por especificações usuais de mercado (comuns) ou se possuem alta heterogeneidade ou complexidade (especiais).',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Indique se o objeto é um bem ou serviço comum ou especial. Esta definição impacta a modalidade de licitação a ser utilizada (geralmente Pregão para comuns)."
  },
  { 
    id: 'tr-4', 
    title: '4. Modelo de Execução do Objeto e Requisitos da Contratação', 
    placeholder: 'Descreva a dinâmica completa da execução do contrato, incluindo:\n- 4.1. Detalhamento do Objeto: Todas as especificações técnicas necessárias.\n- 4.2. Forma de Execução: Métodos, diretrizes, reparos, substituições.\n- 4.3. Rotinas de Execução: Manutenção preventiva, corretiva, serviços eventuais, indicação de marcas (se aplicável), cronograma.\n- 4.4. Local da Prestação.\n- 4.5. Treinamento (se aplicável).\n- 4.6. Manutenção e Suporte Técnico (se aplicável).\n- 4.7 a 4.13. Requisitos Adicionais: Garantia, Ensaio/Certificação, Sigilo, Cessão de Direitos, Transição Contratual, etc.',
    hasGen: true, 
    hasRiskAnalysis: true,
    tooltip: "Conforme Art. 6º, XXIII, 'c', 'd' e 'e' da Lei 14.133/21. Esta é a seção mais detalhada, onde se define como o contrato deverá produzir os resultados, os requisitos e as condições de execução."
  },
  { 
    id: 'tr-5', 
    title: '5. Prazo de Execução dos Serviços', 
    placeholder: 'Defina o prazo de execução dos serviços em dias/meses. Especifique o marco inicial para a contagem do prazo (ex: a partir da emissão da Ordem de Serviço). Detalhe as condições para eventual prorrogação.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "O prazo de execução deve ser realista e compatível com a complexidade do objeto, não podendo ser inexequível ou excessivo."
  },
  { 
    id: 'tr-6', 
    title: '6. Prazo de Vigência do Contrato', 
    placeholder: 'Defina o prazo de vigência do contrato em meses, a contar da data de sua formalização. Especifique se a contratação é de serviço contínuo ou por escopo, e detalhe as regras para prorrogação, se aplicável.',
    hasGen: true, 
    hasRiskAnalysis: true,
    tooltip: "Diferente do prazo de execução, a vigência se refere à duração jurídica do contrato. Para serviços contínuos, pode ser prorrogado até o limite legal."
  },
  { 
    id: 'tr-7', 
    title: '7. Garantia Contratual', 
    placeholder: 'Especifique se será exigida garantia de execução do contrato. Em caso afirmativo, defina o percentual (geralmente 5% do valor do contrato) e as modalidades aceitas (caução, seguro-garantia, fiança bancária), conforme Art. 96 da Lei 14.133/21.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "A exigência de garantia deve ser justificada, considerando a natureza do objeto, o volume financeiro e os riscos envolvidos."
  },
  { 
    id: 'tr-8', 
    title: '8. Obrigações das Partes', 
    placeholder: 'Liste de forma detalhada todas as obrigações da Contratada e da Contratante (TCE-RJ). \n- 8.1 Obrigações da Contratada: Executar os serviços, alocar recursos, manter habilitação, arcar com ônus, reparar vícios, cumprir obrigações trabalhistas, etc.\n- 8.2 Obrigações do TCE-RJ: Expedir autorização, proporcionar facilidades, fiscalizar, efetuar pagamentos, aplicar sanções, etc.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Detalhe todos os deveres e responsabilidades de ambas as partes para garantir a clareza e a segurança jurídica na execução do contrato."
  },
  { 
    id: 'tr-9', 
    title: '9. Forma e Critérios de Seleção do Fornecedor', 
    placeholder: 'Indique a modalidade de licitação (ex: Pregão Eletrônico) e o critério de julgamento a ser adotado (ex: Menor Preço, Maior Desconto). Justifique a escolha, considerando as especificidades do objeto.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Conforme Art. 6º, XXIII, 'h'. A forma de seleção deve ser compatível com a natureza do objeto (comum ou especial)."
  },
  { 
    id: 'tr-10', 
    title: '10. Participação de Consórcio e Cooperativas', 
    placeholder: 'Indique se será permitida ou não a participação de empresas em consórcio e/ou cooperativas de trabalho, justificando a decisão com base na complexidade e natureza do objeto.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "A regra geral permite a participação, salvo vedações justificadas. A vedação deve ser excepcional e fundamentada."
  },
  { 
    id: 'tr-11', 
    title: '11. Qualificação Técnica Exigida', 
    placeholder: 'Descreva os requisitos de qualificação técnica que os licitantes deverão comprovar, como registro em entidade profissional, atestados de capacidade técnica, comprovação de equipe técnica, etc. As exigências devem ser pertinentes e proporcionais ao objeto.',
    hasGen: true, 
    hasRiskAnalysis: true,
    tooltip: "Conforme Art. 67 da Lei 14.133/21. Os requisitos não podem restringir indevidamente a competição e devem ser indispensáveis à garantia do cumprimento das obrigações."
  },
  { 
    id: 'tr-12', 
    title: '12. Vistoria Técnica', 
    placeholder: 'Informe se será facultada ou exigida a realização de vistoria técnica. Caso seja exigida, justifique a imprescindibilidade e defina as regras para agendamento e realização.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "A exigência de vistoria é excepcional e deve ser justificada. A regra é substituí-la por declaração do licitante de que conhece as condições locais."
  },
  { 
    id: 'tr-13', 
    title: '13. Qualificação Econômico-Financeira', 
    placeholder: 'Descreva os requisitos de qualificação econômico-financeira, como apresentação de balanço patrimonial, índices contábeis (Liquidez, Solvência) e comprovação de patrimônio líquido mínimo, se aplicável.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Conforme Art. 69 da Lei 14.133/21. Visa a demonstrar a aptidão econômica do licitante para cumprir as obrigações do contrato."
  },
  { 
    id: 'tr-14', 
    title: '14. Da Subcontratação', 
    placeholder: 'Indique se será permitida a subcontratação parcial do objeto. Em caso afirmativo, defina o limite percentual e as condições, ressaltando que a responsabilidade integral permanece com a contratada.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Conforme Art. 122 da Lei 14.133/21. A subcontratação deve ser autorizada e seus limites e condições precisam ser estabelecidos."
  },
  { 
    id: 'tr-15', 
    title: '15. Modelo de Gestão do Contrato', 
    placeholder: 'Descreva como a execução do objeto será acompanhada e fiscalizada, indicando os servidores/setores responsáveis pela gestão e fiscalização do contrato e suas respectivas atribuições.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Conforme Art. 6º, XXIII, 'f' e Art. 117 da Lei 14.133/21. Defina os papéis do gestor e do fiscal do contrato."
  },
  { 
    id: 'tr-16', 
    title: '16. Critérios de Medição e Recebimento do Objeto', 
    placeholder: 'Defina como os serviços/bens serão medidos para fins de pagamento (ex: mensalmente, por entrega, etc.). Descreva os procedimentos para o recebimento provisório e definitivo do objeto.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Conforme Art. 6º, XXIII, 'g' e Art. 140 da Lei 14.133/21. Os critérios devem ser objetivos e claros para evitar controvérsias."
  },
  { 
    id: 'tr-17', 
    title: '17. Forma de Pagamento', 
    placeholder: 'Descreva as condições de pagamento, como o prazo para pagamento após a apresentação da nota fiscal e o recebimento definitivo. Indique a possibilidade de ajustes, descontos ou antecipação, se aplicável.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Conforme Art. 6º, XXIII, 'g'. A forma de pagamento deve estar alinhada com os critérios de medição e recebimento."
  },
  { 
    id: 'tr-18', 
    title: '18. Sanções Administrativas', 
    placeholder: 'Liste as sanções aplicáveis em caso de descumprimento total ou parcial do contrato, incluindo advertência, multas (moratória e compensatória) e suas bases de cálculo, e as penalidades mais graves como impedimento de licitar e declaração de inidoneidade.',
    hasGen: true,
    hasRiskAnalysis: true,
    tooltip: "Conforme Arts. 155 a 163 da Lei 14.133/21. As sanções devem ser proporcionais à gravidade da infração."
  }
];

export const riskMapSections: Section[] = [
  {
    id: 'risk-map-intro',
    title: '1. Introdução',
    placeholder: 'Descreva o contexto geral do gerenciamento de riscos para esta contratação. O objetivo é permitir ações contínuas de planejamento, organização e controle dos recursos relacionados aos riscos que possam comprometer o sucesso da contratação, da execução do objeto e da gestão contratual.',
    hasGen: true,
    hasRiskAnalysis: false,
    tooltip: "Apresente o objetivo e o escopo do Mapa de Riscos da Contratação."
  },
];