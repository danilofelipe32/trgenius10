import { Template } from '../types';

export const etpTemplates: Template[] = [
  {
    id: 'etp-ti-equipment',
    name: 'Aquisição de Equipamentos de TI',
    description: 'Template para compra de computadores, notebooks, servidores ou outros equipamentos de informática.',
    type: 'etp',
    sections: {
      'etp-1': 'Este Estudo Técnico Preliminar (ETP) visa a analisar a viabilidade e definir os requisitos para a contratação de uma solução de modernização do parque tecnológico da instituição, por meio da aquisição de notebooks. O objetivo é subsidiar a elaboração do Termo de Referência para a referida aquisição, sob a coordenação do Departamento de Tecnologia da Informação.',
      'etp-2': 'A necessidade da contratação decorre da obsolescência dos equipamentos de computação pessoal atualmente em uso na instituição, muitos dos quais com mais de 4 anos de utilização. Este cenário acarreta lentidão na execução de tarefas, incompatibilidade com softwares modernos, aumento dos custos de manutenção corretiva e vulnerabilidades de segurança. A não contratação implicaria em contínua perda de produtividade dos servidores, elevação dos riscos de incidentes de segurança da informação e prejuízo à imagem da instituição.',
      'etp-3': 'Departamento de Tecnologia da Informação (DTI) e Departamento de Administração (DA).',
      'etp-4': '**Requisitos de Negócio:**\n- Prover aos servidores equipamentos que suportem o regime de trabalho híbrido (presencial e remoto).\n- Garantir a execução de softwares de produtividade, videochamada e sistemas corporativos sem travamentos.\n\n**Requisitos Legais:**\n- Atendimento à Lei Geral de Proteção de Dados (LGPD) com recursos de segurança embarcados.\n- Garantia do produto em conformidade com o Código de Defesa do Consumidor.\n\n**Requisitos Gerais:**\n- Garantia técnica mínima de 36 meses, modalidade on-site.\n- Equipamentos devem ser novos e de primeiro uso.',
      'etp-5': 'Foram analisadas as seguintes soluções de mercado:\n1. **Aquisição de notebooks:** Compra definitiva dos equipamentos.\n2. **Locação de notebooks (HaaS - Hardware as a Service):** Contratação de serviço que inclui os equipamentos e manutenção.\n\n**Análise Comparativa:**\n- **Custo:** A aquisição (Solução 1) apresenta um custo total de propriedade (TCO) menor em um horizonte de 4 anos.\n- **Gestão:** A locação (Solução 2) simplifica a gestão de ativos e manutenção.\n\n**Justificativa da Escolha:** Opta-se pela **Solução 1 (Aquisição)**, pois o menor TCO representa maior economicidade para a Administração a longo prazo, e a estrutura de TI interna possui capacidade para gerenciar os ativos adquiridos.',
      'etp-6': 'A solução escolhida consiste na aquisição de notebooks corporativos com especificações técnicas que garantam performance e longevidade. Será exigido dos licitantes atestado de capacidade técnica para fornecimento de equipamentos de TI, a fim de assegurar que a empresa possui experiência prévia em contratações de porte similar, minimizando riscos de entrega e de qualidade.',
      'etp-7': 'A estimativa de 50 (cinquenta) unidades baseia-se no levantamento realizado pelo setor de patrimônio, que identificou 50 equipamentos com mais de 4 anos de uso e fora do período de garantia, os quais apresentam problemas recorrentes de performance e hardware. (Vide Memorando anexo).',
      'etp-8': 'A estimativa de valor foi realizada com base em ampla pesquisa de mercado, conforme detalhado:\n- **Painel de Preços do Governo Federal:** Mediana de preços para item similar: R$ 5.200,00.\n- **Contratações Similares (PNCP):** Valor médio em 3 contratos de outros órgãos: R$ 4.950,00.\n- **Pesquisa com Fornecedores:** Média de 3 cotações: R$ 5.100,00.\nAdotando-se a média ponderada, o valor de referência unitário é de R$ 5.000,00, totalizando um valor estimado de **R$ 250.000,00** para 50 unidades.',
      'etp-9': 'A contratação não será parcelada, sendo realizada em lote único. A justificativa para esta decisão reside na necessidade de padronização tecnológica dos equipamentos. A aquisição de um mesmo modelo de notebook para todos os usuários facilita a criação de imagens de sistema, a gestão de drivers, o suporte técnico e a manutenção, além de simplificar a gestão de garantias e gerar economia de escala na aquisição.',
      'etp-10': 'Esta contratação é interdependente da contratação de licenças de sistema operacional e de softwares de produtividade, cujos processos já estão em andamento. Não há outras contratações correlatas que impactem ou sejam impactadas diretamente por esta aquisição.',
      'etp-11': 'A presente contratação está alinhada ao Plano de Contratações Anual (PCA) 2024, item de necessidade nº 42, e ao Plano Diretor de Tecnologia da Informação (PDTI) 2024-2025, no que tange ao objetivo estratégico OE-03: "Modernizar a Infraestrutura de Tecnologia da Informação e Comunicação".',
      'etp-12': 'Os resultados pretendidos são:\n- **Economicidade:** Redução de 50% nos custos anuais com manutenção corretiva de computadores.\n- **Eficiência:** Aumento da produtividade dos servidores, com redução estimada de 15% no tempo gasto em tarefas que dependem de processamento computacional.\n- **Eficácia:** Melhoria do nível de segurança da informação da instituição, com a mitigação de vulnerabilidades presentes em equipamentos obsoletos.',
      'etp-13': 'Antes da celebração do contrato, o Departamento de Administração deverá realizar as seguintes providências:\n- Organizar o espaço físico no almoxarifado para o recebimento e armazenamento temporário dos equipamentos.\n- Elaborar, em conjunto com o setor de patrimônio, o plano de recolhimento dos equipamentos antigos a serem substituídos.\n- Designar formalmente o fiscal técnico e o fiscal administrativo do contrato.',
      'etp-14': 'Serão incluídos como requisitos de sustentabilidade:\n- Os equipamentos deverão possuir certificação de eficiência energética (ex: selo Procel ou Energy Star).\n- O fornecedor deverá apresentar um plano de logística reversa para as embalagens dos produtos, garantindo seu descarte ambientalmente adequado.',
      'etp-15': 'Diante do exposto, conclui-se pela **viabilidade** da contratação para aquisição de notebooks, por ser a solução que melhor atende à necessidade da Administração, alinhada ao seu planejamento, tecnicamente justificada e economicamente vantajosa.',
    },
  },
  // NOVOS TEMPLATES ADICIONADOS
  {
    id: 'etp-dispensa-aq-continuo',
    name: '(DISPENSA ELETRÔNICA) - Aquisição - Fornecimento Contínuo',
    description: 'ETP para aquisição de bens por dispensa eletrônica com fornecimento contínuo (ex: materiais de escritório, café).',
    type: 'etp',
    sections: {
      'etp-2': 'A necessidade da contratação decorre da demanda contínua por [material de consumo, ex: café, papel] para a manutenção das atividades administrativas do órgão. A ausência desses itens impactaria diretamente a rotina de trabalho e o bem-estar dos servidores. A contratação por dispensa de licitação em razão do valor, com fornecimento contínuo, otimiza o processo e garante o suprimento regular.',
      'etp-5': 'A solução mais adequada é a contratação direta por dispensa de licitação (Art. 75, II da Lei 14.133/21), utilizando o sistema de Dispensa Eletrônica para garantir a competitividade e a vantajosidade. A alternativa seria uma licitação na modalidade Pregão, porém, para o valor estimado, a dispensa se mostra mais célere e econômica.',
      'etp-9': 'Justifica-se o não parcelamento para garantir a padronização dos itens e obter economia de escala, além de simplificar a gestão de um único contrato de fornecimento.'
    }
  },
  {
    id: 'etp-licitacao-aq-continuo-srp',
    name: '(LICITAÇÃO - inclusive SRP) - Aquisição - Fornecimento Contínuo',
    description: 'ETP para aquisição de bens de forma contínua via licitação (Pregão), com possibilidade de Sistema de Registro de Preços.',
    type: 'etp',
    sections: {
       'etp-2': 'A demanda por [tipo de bem, ex: toners para impressora] é contínua e recorrente, sendo essencial para o funcionamento das atividades do órgão. A não contratação levaria à paralisação de serviços essenciais. A realização de licitação para Registro de Preços se justifica pela impossibilidade de prever com exatidão o quantitativo total a ser demandado e pela conveniência de aquisições parceladas.',
       'etp-5': 'A solução escolhida é a realização de Pregão Eletrônico para formação de Sistema de Registro de Preços (SRP). Esta modalidade permite aquisições sob demanda, conferindo flexibilidade e agilidade à Administração, além de potencializar a economia de escala ao permitir a adesão de outros órgãos.',
       'etp-12': 'Espera-se obter economia de escala, celeridade nas aquisições, padronização dos bens adquiridos e manutenção de um estoque mínimo, reduzindo custos de armazenamento.'
    }
  },
   {
    id: 'etp-dispensa-serv-sem-mao-obra',
    name: '(DISPENSA ELETRÔNICA) Serviço sem mão de obra dedicada',
    description: 'ETP para serviços pontuais sem alocação de mão de obra exclusiva, via dispensa eletrônica (ex: manutenção de ar condicionado).',
    type: 'etp',
    sections: {
      'etp-2': 'Necessidade de contratação de serviços de [ex: manutenção corretiva de ar-condicionado] para atender a demandas pontuais e não contínuas. A falta do serviço compromete o ambiente de trabalho. A contratação por dispensa (Art. 75, II) é adequada devido ao valor estimado e à natureza não contínua do serviço.',
      'etp-5': 'A contratação via Dispensa Eletrônica (Art. 75, § 3º) é a solução mais célere e eficiente para demandas de baixo valor, garantindo competitividade entre os fornecedores. Uma licitação formal seria desproporcional para o objeto em questão.',
    }
  },
  {
    id: 'etp-contratacao-direta-serv-sem-mao-obra',
    name: '(DISPENSA E INEXIGIBILIDADE) - Serviço sem mão de obra dedicada',
    description: 'ETP para contratação direta (dispensa ou inexigibilidade) de serviços sem mão de obra dedicada (ex: consultoria especializada).',
    type: 'etp',
    sections: {
      'etp-2': 'Justificativa da necessidade de contratação de serviço técnico especializado de [área], de natureza singular, para [objetivo]. A complexidade do objeto e a necessidade de notória especialização do contratado inviabilizam a competição, caracterizando a hipótese de inexigibilidade de licitação (Art. 74).',
      'etp-5': 'O levantamento de mercado demonstrou que a empresa/profissional [Nome] possui notória especialização, sendo a única capaz de atender à necessidade da Administração com a expertise requerida, conforme currículo e atestados anexos.',
      'etp-6': 'A solução consiste na contratação de [empresa/profissional] para a elaboração de [produto: parecer, laudo, etc.], dada sua singularidade e especialização no tema, sendo inviável a competição.'
    }
  },
   {
    id: 'etp-licitacao-serv-residente',
    name: '(LICITAÇÃO) Serviços sem mão de obra residente',
    description: 'ETP para serviços contínuos sem dedicação exclusiva de mão de obra (ex: desenvolvimento de software, suporte técnico remoto).',
    type: 'etp',
    sections: {
      'etp-2': 'Necessidade de contratação de serviços contínuos de [ex: suporte e evolução de sistema de software] para garantir a operacionalidade de sistemas críticos da instituição. A natureza do serviço não exige a presença constante de profissionais nas dependências do órgão.',
      'etp-5': 'A solução via Pregão Eletrônico para contratação de empresa especializada mostra-se a mais vantajosa. A alternativa de equipe própria é inviável pela alta rotatividade de profissionais de TI e pela necessidade de expertise diversificada.',
      'etp-12': 'Manter a estabilidade e a segurança dos sistemas corporativos, garantir a evolução tecnológica contínua e obter suporte técnico especializado para resolução de incidentes.'
    }
  },
   {
    id: 'etp-srp-serv-residente',
    name: '(LICITAÇÃO SRP) - Serviços sem mão de obra residente',
    description: 'ETP para Registro de Preços de serviços contínuos sem dedicação exclusiva de mão de obra (ex: horas de desenvolvimento).',
    type: 'etp',
    sections: {
       'etp-2': 'A demanda por serviços de [ex: desenvolvimento de novas funcionalidades em sistemas] é recorrente, porém de quantitativo imprevisível. O SRP permite a contratação sob demanda, garantindo agilidade e economicidade.',
       'etp-5': 'A realização de Pregão para Registro de Preços é a solução que melhor se adequa à natureza da necessidade, permitindo a contratação de "pacotes de horas" ou "unidades de serviço" conforme a demanda surge, evitando a ociosidade de uma equipe fixa.',
    }
  },
   {
    id: 'etp-licitacao-serv-dedicada',
    name: '(LICITAÇÃO) - Serviços com dedicação de mão de obra',
    description: 'ETP para licitação de serviços contínuos com dedicação exclusiva de mão de obra (ex: limpeza, portaria, vigilância).',
    type: 'etp',
    sections: {
       'etp-2': 'Necessidade de garantir a prestação contínua de serviços de [ex: limpeza e conservação] para a manutenção das condições de higiene e salubridade das instalações do órgão. A execução destes serviços exige a alocação de postos de trabalho fixos em regime de dedicação exclusiva.',
       'etp-5': 'A contratação de empresa especializada por meio de Pregão Eletrônico é a solução que atende à necessidade, transferindo à contratada a responsabilidade pela gestão da mão de obra e dos encargos trabalhistas, conforme Súmula 331 do TST.',
       'etp-13': 'É necessário adequar as dependências para a disponibilização de vestiários e local para guarda dos materiais da contratada.'
    }
  },
   {
    id: 'etp-srp-serv-dedicada',
    name: '(LICITAÇÃO SRP) - Serviços com dedicação de mão de obra',
    description: 'ETP para SRP de serviços contínuos com dedicação exclusiva de mão de obra (ex: postos de serviço sob demanda).',
    type: 'etp',
    sections: {
       'etp-2': 'A necessidade de serviços com mão de obra dedicada (ex: postos de recepcionista) é recorrente, mas pode variar em quantidade ao longo do ano devido a eventos ou projetos específicos. O SRP oferece a flexibilidade necessária para ativar ou desativar postos conforme a demanda.',
       'etp-5': 'A licitação via Pregão para Registro de Preços é a solução mais vantajosa, pois permite ao órgão dimensionar a força de trabalho de forma dinâmica, pagando apenas pelos postos efetivamente demandados, gerando grande economia e eficiência na gestão contratual.',
    }
  },
  {
    id: 'etp-serv-engenharia',
    name: '(LICITAÇÃO) - Serviços de Engenharia',
    description: 'ETP para a contratação de obras ou serviços de engenharia por meio de licitação (concorrência ou pregão).',
    type: 'etp',
    sections: {
      'etp-2': 'Necessidade da contratação de serviço de engenharia para [ex: reforma do sistema elétrico do Edifício-Sede] em razão de [descrever problema: instalações antigas, risco de incêndio, sobrecarga]. A não execução da obra representa grave risco à segurança de servidores e do patrimônio público.',
      'etp-5': 'A contratação de empresa especializada em engenharia elétrica é a única solução viável. A licitação será na modalidade Concorrência (ou Pregão, se serviço comum de engenharia), garantindo a seleção da proposta mais vantajosa com base em projeto básico detalhado.',
      'etp-6': 'A solução consiste na reforma completa das instalações elétricas, incluindo substituição de quadros, fiação e disjuntores, conforme projeto básico anexo. Será exigido da licitante a comprovação de capacidade técnica por meio de CAT (Certidão de Acervo Técnico) compatível com a complexidade da obra.',
    }
  }
];

export const trTemplates: Template[] = [
  {
    id: 'tr-notebooks',
    name: 'Aquisição de Notebooks',
    description: 'Modelo detalhado para a compra de computadores portáteis para uso institucional.',
    type: 'tr',
    sections: {
      'tr-1': '**1.1 Objeto:** Aquisição de 50 (cinquenta) notebooks corporativos, novos e de primeiro uso, incluindo garantia técnica on-site de 36 meses, conforme especificações técnicas detalhadas no Anexo I deste Termo de Referência.\n**1.3 Regime de Execução:** Empreitada por preço unitário.',
      'tr-2': '**2.1 Justificativa:** A contratação é necessária para a modernização do parque tecnológico desta instituição, em conformidade com o Plano Diretor de TI, visando substituir equipamentos obsoletos que apresentam lentidão, falhas constantes e riscos de segurança. A fundamentação completa para a escolha desta solução encontra-se no Estudo Técnico Preliminar nº 123/2024.',
      'tr-3': '**3.1 Natureza do Objeto:** O objeto desta contratação é classificado como um bem comum, pois seus padrões de desempenho e qualidade podem ser objetivamente definidos por meio de especificações usuais de mercado, conforme detalhado no Anexo I.',
      'tr-4': '**4.1 Detalhamento do Objeto:** As especificações técnicas mínimas, de qualidade e de desempenho para os notebooks estão detalhadas no Anexo I.\n**4.2 Forma de Execução:** A entrega deverá ser única, no prazo estipulado, e os bens devem ser novos, sem uso, em embalagens originais e lacradas.\n**4.8 Garantia:** A garantia técnica mínima exigida é de 36 (trinta e seis) meses, modalidade "on-site", com atendimento em até 48 horas úteis.',
      'tr-5': '**5.1 Prazo de Execução:** O prazo para a entrega total dos 50 (cinquenta) notebooks será de até 30 (trinta) dias corridos, contados a partir da data de assinatura do contrato.',
      'tr-6': '**6.1 Prazo de Vigência:** O prazo de vigência do contrato será de 12 (doze) meses, contados da sua assinatura, não sendo prorrogável. Este prazo visa a garantir o acompanhamento da entrega e o início da garantia.',
      'tr-7': '**7.1 Garantia de Execução:** Será exigida da contratada a prestação de garantia de execução no valor correspondente a 5% (cinco por cento) do valor total do contrato, em uma das modalidades previstas no art. 96 da Lei nº 14.133/2021.',
      'tr-8': '**8.1 Obrigações da Contratada:** Entregar os bens em conformidade com as especificações; cumprir os prazos; prestar a garantia técnica; manter as condições de habilitação; etc.\n**8.2 Obrigações da Contratante:** Efetuar o pagamento no prazo; fiscalizar a execução; notificar a contratada sobre irregularidades; etc.',
      'tr-9': '**9.1 Forma de Seleção:** A seleção do fornecedor será realizada por meio de licitação, na modalidade Pregão, em sua forma Eletrônica, com critério de julgamento de Menor Preço por item.',
      'tr-10': '**10.1 Consórcio:** Não será admitida a participação de empresas em consórcio, tendo em vista a natureza divisível e a não complexidade do objeto.\n**10.2 Cooperativas:** Será permitida a participação de cooperativas, desde que atendam a todos os requisitos de habilitação.',
      'tr-11': '**11.1 Qualificação Técnica:** Será exigida a apresentação de, no mínimo, 1 (um) Atestado de Capacidade Técnica, em nome do licitante, que comprove o fornecimento de equipamentos de informática em quantidade compatível com o objeto desta licitação.',
      'tr-12': '**12.1 Vistoria Técnica:** Não se aplica, pois a simples descrição do objeto no Termo de Referência é suficiente para o perfeito entendimento do objeto a ser contratado.',
      'tr-13': '**13.1 Qualificação Econômico-Financeira:** Os licitantes deverão apresentar Balanço Patrimonial do último exercício social; comprovar Patrimônio Líquido de, no mínimo, 10% do valor estimado da contratação; apresentar certidão negativa de falência.',
      'tr-14': '**14.1 Subcontratação:** Não será admitida a subcontratação do objeto, por se tratar de fornecimento de bens.',
      'tr-15': '**15.1 Gestão e Fiscalização:** A gestão do contrato caberá ao Chefe do Setor de Compras, e a fiscalização técnica será realizada por servidor do Departamento de TI, a ser formalmente designado.',
      'tr-16': '**16.1 Medição e Recebimento:** O recebimento provisório será realizado pelo Almoxarifado no ato da entrega, para verificação quantitativa. O recebimento definitivo será realizado pelo fiscal técnico em até 5 (cinco) dias úteis, após verificação da conformidade com as especificações.',
      'tr-17': '**17.1 Forma de Pagamento:** O pagamento será realizado em parcela única, por meio de crédito em conta corrente, em até 30 (trinta) dias contados da data do recebimento definitivo do objeto e da apresentação da nota fiscal devidamente atestada.',
      'tr-18': '**18.1 Sanções:** Pela inexecução total ou parcial do contrato, a Administração poderá aplicar as seguintes sanções: advertência; multa de 0,5% por dia de atraso na entrega (limitada a 10%); multa de 10% por inexecução parcial; multa de 20% por inexecução total; impedimento de licitar e contratar; declaração de inidoneidade.',
    },
  },
  // NOVOS TEMPLATES ADICIONADOS
  {
    id: 'tr-dispensa-aq-continuo',
    name: '(DISPENSA ELETRÔNICA) - Aquisição - Fornecimento Contínuo',
    description: 'TR para aquisição de bens (fornecimento contínuo) por dispensa eletrônica (Art. 75, II).',
    type: 'tr',
    sections: {
      'tr-1': 'Aquisição de [ex: café e açúcar] para consumo contínuo, por um período de 12 meses, com entregas parceladas conforme a demanda. Quantitativo estimado: [XXX] kg de café, [YYY] kg de açúcar.',
      'tr-2': 'A contratação se justifica pela necessidade de suprir a demanda contínua por gêneros alimentícios para o funcionamento da copa, conforme ETP nº XXX/AAAA. A contratação direta por dispensa de licitação fundamenta-se no Art. 75, II da Lei 14.133/21.',
      'tr-9': 'A seleção do fornecedor se dará por contratação direta por dispensa de licitação em razão do valor, com disputa por meio do Sistema de Dispensa Eletrônica, com critério de julgamento de Menor Preço por item.'
    }
  },
  {
    id: 'tr-licitacao-aq-continuo-srp',
    name: '(LICITAÇÃO - inclusive SRP) - Aquisição - Fornecimento Contínuo',
    description: 'TR para Registro de Preços visando ao fornecimento contínuo de bens (ex: material de expediente, toners).',
    type: 'tr',
    sections: {
      'tr-1': 'Registro de Preços para futura e eventual aquisição de [ex: cartuchos de toner para impressoras], para um período de 12 meses, com entregas sob demanda. Quantidade máxima estimada: [XXX] unidades.',
      'tr-2': 'A contratação via SRP se justifica pela necessidade recorrente de aquisição do material, cuja demanda exata é de difícil previsão, sendo mais vantajoso para a Administração realizar as aquisições de forma parcelada, conforme ETP nº XXX/AAAA.',
      'tr-9': 'A seleção do fornecedor se dará por licitação, modalidade Pregão Eletrônico, para formação de Sistema de Registro de Preços (SRP), com critério de julgamento de Menor Preço por item.'
    }
  },
   {
    id: 'tr-dispensa-serv-sem-mao-obra',
    name: '(DISPENSA ELETRÔNICA) Serviço sem mão de obra dedicada',
    description: 'TR para serviços pontuais sem mão de obra dedicada por dispensa eletrônica.',
    type: 'tr',
    sections: {
      'tr-1': 'Contratação de serviço de [ex: desinsetização e desratização] para as instalações do órgão, a ser realizado em [indicar frequência, ex: uma única vez, semestralmente].',
      'tr-2': 'A contratação se justifica pela necessidade de manter o ambiente de trabalho livre de pragas, em conformidade com as normas de vigilância sanitária, conforme ETP nº XXX/AAAA. A contratação direta fundamenta-se no Art. 75, II da Lei 14.133/21.',
      'tr-9': 'A seleção se dará por dispensa de licitação em razão do valor, com disputa via Sistema de Dispensa Eletrônica, adotando-se o critério de Menor Preço Global.'
    }
  },
  {
    id: 'tr-contratacao-direta-serv-sem-mao-obra',
    name: '(DISPENSA E INEXIGIBILIDADE) - Serviço sem mão de obra dedicada',
    description: 'TR para contratação direta (dispensa ou inexigibilidade) de serviço técnico especializado.',
    type: 'tr',
    sections: {
      'tr-1': 'Contratação de [empresa/profissional] para a prestação de serviço técnico especializado de [natureza], consistente na elaboração de [objeto, ex: parecer jurídico sobre tema específico].',
      'tr-2': 'A contratação se justifica pela notória especialização do contratado e pela natureza singular do serviço, que inviabiliza a competição, caracterizando a hipótese de inexigibilidade de licitação, conforme Art. 74, III, da Lei 14.133/21 e ETP nº XXX/AAAA.',
      'tr-9': 'A seleção do fornecedor se dará por contratação direta por inexigibilidade de licitação, com a devida justificativa de preço e razão da escolha do executante.',
      'tr-11': 'Não se exige qualificação técnica adicional, uma vez que a própria escolha do contratado se baseia em sua notória especialização.'
    }
  },
   {
    id: 'tr-licitacao-serv-residente',
    name: '(LICITAÇÃO) Serviços sem mão de obra residente',
    description: 'TR para licitar serviços contínuos sem dedicação exclusiva de mão de obra (mão de obra residente).',
    type: 'tr',
    sections: {
      'tr-1': 'Contratação de empresa para prestação de serviços continuados de [ex: desenvolvimento e manutenção de sistemas], sem regime de dedicação exclusiva de mão de obra, pelo período de 12 meses.',
      'tr-2': 'A contratação é essencial para garantir a continuidade, a evolução e a sustentação dos sistemas de informação do órgão, conforme ETP nº XXX/AAAA.',
      'tr-9': 'A seleção do fornecedor será por meio de Pregão Eletrônico, critério de julgamento Técnica e Preço, dada a natureza predominantemente intelectual do serviço.'
    }
  },
   {
    id: 'tr-srp-serv-residente',
    name: '(LICITAÇÃO SRP) - Serviços sem mão de obra residente',
    description: 'TR para Registro de Preços de serviços contínuos sem mão de obra residente.',
    type: 'tr',
    sections: {
       'tr-1': 'Registro de Preços para contratação de serviços de [ex: fábrica de software], medidos em Unidades de Serviço Técnico (UST) ou horas, sem dedicação exclusiva de mão de obra.',
       'tr-2': 'A contratação via SRP se justifica pela necessidade recorrente de desenvolvimento e manutenção de sistemas, com demanda variável e de difícil mensuração prévia, conforme ETP nº XXX/AAAA.',
       'tr-9': 'A seleção se dará por Pregão Eletrônico para Sistema de Registro de Preços, critério de julgamento de Menor Preço por item (valor da UST/hora).'
    }
  },
   {
    id: 'tr-licitacao-serv-dedicada',
    name: '(LICITAÇÃO) - Serviços com dedicação de mão de obra',
    description: 'TR para licitar serviços contínuos com dedicação exclusiva de mão de obra (terceirização).',
    type: 'tr',
    sections: {
       'tr-1': 'Contratação de empresa especializada para prestação de serviços continuados de [ex: limpeza, asseio e conservação predial], com regime de dedicação exclusiva de mão de obra, para atender às necessidades do órgão.',
       'tr-2': 'A contratação se justifica pela necessidade de manter as instalações em condições adequadas de higiene e funcionamento, sendo essencial para o bem-estar dos servidores e do público, conforme ETP nº XXX/AAAA.',
       'tr-9': 'A seleção se dará por Pregão Eletrônico, critério de julgamento de Menor Preço Global por lote.',
       'tr-15': 'A gestão e fiscalização do contrato exigirão o acompanhamento estrito do cumprimento das obrigações trabalhistas e previdenciárias por parte da contratada, incluindo a verificação de folha de pagamento, FGTS e INSS.'
    }
  },
   {
    id: 'tr-srp-serv-dedicada',
    name: '(LICITAÇÃO SRP) - Serviços com dedicação de mão de obra',
    description: 'TR para SRP de serviços contínuos com dedicação exclusiva de mão de obra.',
    type: 'tr',
    sections: {
       'tr-1': 'Registro de Preços para contratação de serviços continuados com dedicação exclusiva de mão de obra, para a prestação de [ex: serviços de recepção], conforme demanda do órgão.',
       'tr-2': 'A contratação via SRP é vantajosa para suprir necessidades recorrentes de postos de serviço, cuja quantidade pode variar ao longo da vigência da ata, permitindo a contratação sob demanda e otimizando os recursos, conforme ETP nº XXX/AAAA.',
       'tr-9': 'A seleção se dará por Pregão Eletrônico para formação de Sistema de Registro de Preços (SRP), critério de julgamento de Menor Preço por lote (agrupamento de postos).',
    }
  },
  {
    id: 'tr-serv-engenharia',
    name: '(LICITAÇÃO) - Serviços de Engenharia',
    description: 'TR para a contratação de obras ou serviços comuns de engenharia por licitação.',
    type: 'tr',
    sections: {
      'tr-1': 'Contratação de empresa de engenharia para execução de [ex: obra de reforma do auditório], incluindo fornecimento de materiais e mão de obra, conforme Projeto Básico e seus anexos.',
      'tr-2': 'A contratação se justifica pela necessidade de adequar as instalações do auditório às normas de acessibilidade e segurança, conforme ETP nº XXX/AAAA e laudo técnico anexo.',
      'tr-4': 'A execução da obra seguirá o cronograma físico-financeiro detalhado no Projeto Básico. Será exigida a Anotação de Responsabilidade Técnica (ART) do engenheiro responsável.',
      'tr-9': 'A seleção do fornecedor se dará por licitação na modalidade Concorrência (ou Pregão, se serviço comum), com critério de julgamento de Menor Preço Global.',
      'tr-11': 'Será exigida a apresentação de Certidão de Acervo Técnico (CAT) do Conselho Regional de Engenharia e Agronomia (CREA), compatível com as parcelas de maior relevância técnica e valor significativo do objeto da licitação.'
    }
  }
];
