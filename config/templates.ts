import { Template } from '../types';

export const etpTemplates: Template[] = [
  {
    id: 'etp-ti-equipment',
    name: 'Aquisição de Equipamentos de TI',
    description: 'Template para compra de computadores, notebooks, servidores ou outros equipamentos de informática.',
    type: 'etp',
    sections: {
      'etp-input-introducao': 'Este Estudo Técnico Preliminar (ETP) tem como objetivo planear e fundamentar a aquisição de novos equipamentos de tecnologia da informação para modernizar o parque tecnológico desta instituição, visando aumentar a produtividade e a segurança da informação.',
      'etp-input-demanda': 'A demanda atual surge da obsolescência dos equipamentos em uso, que possuem em média mais de 5 anos de utilização. Isso resulta em lentidão, falhas constantes, incompatibilidade com softwares modernos e riscos de segurança, afetando diretamente a performance dos colaboradores e a continuidade dos serviços.',
      'etp-input-analise-demanda': 'Foi realizado um levantamento interno que identificou 50 estações de trabalho com necessidade de substituição urgente. A análise de desempenho mostrou que o tempo de inicialização dos sistemas críticos é 40% maior nos equipamentos antigos em comparação com máquinas modernas. Além disso, os custos de manutenção corretiva aumentaram 25% no último ano.',
      'etp-input-levantamento-solucoes': 'Foram consideradas as seguintes soluções:\n1.  **Aquisição de Desktops:** Compra de computadores de mesa tradicionais.\n2.  **Aquisição de Notebooks:** Compra de computadores portáteis.\n3.  **Locação de Equipamentos (HaaS - Hardware as a Service):** Contratação de uma empresa que fornece e mantém os equipamentos por um período determinado.\n4.  **Virtualização de Desktops (VDI):** Implementação de uma infraestrutura onde os desktops são executados em servidores centralizados.',
      'etp-input-analise-solucoes': 'A aquisição de notebooks (Solução 2) apresenta o melhor custo-benefício, oferecendo mobilidade para o trabalho híbrido, que se tornou uma realidade na instituição. A locação (Solução 3) tem um custo total de propriedade maior a longo prazo. A VDI (Solução 4) exige um investimento inicial muito elevado em infraestrutura de servidores, o que é inviável no momento.',
      'etp-input-recomendacao': 'Recomenda-se a aquisição de 50 notebooks com especificações técnicas modernas, que atendam às necessidades de performance dos softwares utilizados pela instituição. Esta solução é a mais adequada por combinar performance, mobilidade e um custo de aquisição compatível com o orçamento disponível.',
      'etp-input-anexos': 'Anexo I - Pesquisa de Preços de Mercado.\nAnexo II - Planilha de Análise Comparativa de Soluções.',
    },
  },
  {
    id: 'etp-cleaning-services',
    name: 'Contratação de Serviços de Limpeza',
    description: 'Template para contratar serviços continuados de limpeza, conservação e higienização de áreas.',
    type: 'etp',
    sections: {
      'etp-input-introducao': 'O presente estudo visa fundamentar a contratação de empresa especializada na prestação de serviços continuados de limpeza, asseio e conservação predial, com fornecimento de mão de obra, saneantes domissanitários, materiais e equipamentos, para atender às necessidades das instalações desta instituição.',
      'etp-input-demanda': 'A demanda consiste na necessidade de manter um ambiente de trabalho limpo, higienizado e seguro para servidores e para o público externo, em conformidade com as normas de saúde e segurança do trabalho. O contrato atual está prestes a expirar, sendo imprescindível a nova contratação para não haver interrupção dos serviços.',
      'etp-input-analise-demanda': 'A área total a ser coberta pelos serviços é de 5.000 m², incluindo áreas administrativas, banheiros, áreas de circulação e áreas externas. A frequência e a produtividade foram calculadas com base nas diretrizes da IN SEGES/MP nº 5/2017, estimando-se a necessidade de 4 postos de trabalho em tempo integral.',
      'etp-input-levantamento-solucoes': '1. **Contratação de Empresa Especializada:** Modelo tradicional de terceirização dos serviços.\n2. **Execução Direta:** Contratação de pessoal próprio via concurso público para realizar os serviços.\n3. **Contratação por Empreitada de Mão de Obra:** Contratação apenas da mão de obra, com o órgão fornecendo os materiais e equipamentos.',
      'etp-input-analise-solucoes': 'A execução direta (Solução 2) é inviável devido às restrições orçamentárias e legais para novas contratações de pessoal. A contratação apenas da mão de obra (Solução 3) transfere para a Administração a complexa logística de compra e gestão de estoque de materiais. Portanto, a contratação de empresa especializada (Solução 1) é a mais eficiente, pois centraliza todas as responsabilidades no contratado.',
      'etp-input-recomendacao': 'Recomenda-se a contratação de empresa especializada para a prestação dos serviços de limpeza, conforme Solução 1, por ser o modelo que melhor atende à necessidade da Administração, otimizando a gestão e garantindo a qualidade e continuidade dos serviços.',
      'etp-input-anexos': 'Anexo I - Planilha de Dimensionamento da Equipe.\nAnexo II - Pesquisa de Mercado com Cotações.',
    },
  },
];

export const trTemplates: Template[] = [
  {
    id: 'tr-notebooks',
    name: 'Aquisição de Notebooks',
    description: 'Modelo detalhado para a compra de computadores portáteis para uso institucional.',
    type: 'tr',
    sections: {
      'tr-input-objeto': 'Aquisição de 50 (cinquenta) notebooks, conforme especificações técnicas, condições e prazos estabelecidos neste Termo de Referência e seus anexos. O prazo de garantia mínimo exigido é de 24 (vinte e quatro) meses on-site.',
      'tr-input-justificativa': 'A presente contratação justifica-se pela necessidade de modernização do parque computacional, em substituição a equipamentos obsoletos e com baixo desempenho, conforme detalhado no Estudo Técnico Preliminar nº XXX/2024. A aquisição visa prover aos servidores ferramentas de trabalho adequadas, promovendo maior agilidade, mobilidade e segurança no desempenho de suas atividades.',
      'tr-input-execucao': 'A entrega dos equipamentos deverá ser realizada em parcela única, no prazo máximo de 30 (trinta) dias corridos, contados a partir do recebimento da Nota de Empenho. Os notebooks deverão ser entregues no Almoxarifado Central desta instituição, localizado no endereço [endereço completo], em dias úteis, no horário das 8h às 17h. Todos os equipamentos devem ser novos, de primeiro uso, e entregues em suas embalagens originais lacradas.',
      'tr-input-obrigacoes': '**Obrigações da CONTRATADA:**\n- Entregar os equipamentos em perfeito estado de funcionamento e em conformidade com as especificações deste Termo.\n- Prestar a garantia técnica de 24 meses, on-site, com atendimento em até 48 horas úteis.\n- Fornecer toda a documentação fiscal e técnica dos produtos.\n\n**Obrigações da CONTRATANTE:**\n- Realizar o recebimento provisório e definitivo dos bens.\n- Efetuar o pagamento no prazo e condições estabelecidas.\n- Notificar a contratada sobre quaisquer defeitos ou irregularidades.',
      'tr-input-habilitacao': 'A licitante deverá apresentar Atestado de Capacidade Técnica, emitido por pessoa jurídica de direito público ou privado, que comprove ter fornecido bens de natureza e vulto compatíveis com o objeto desta licitação. Deverá também apresentar declaração do fabricante, ou documento equivalente, assegurando que é revenda autorizada.',
      'tr-input-pagamento': 'O pagamento será efetuado em parcela única, no prazo de até 30 (trinta) dias após o recebimento definitivo dos equipamentos, mediante a apresentação da correspondente nota fiscal devidamente atestada pelo fiscal do contrato. A despesa correrá à conta da dotação orçamentária: [Número da Dotação Orçamentária].',
      'tr-input-fiscalizacao': 'A gestão e fiscalização do contrato serão realizadas por servidor(a) ou comissão designada pela autoridade competente, que será responsável por acompanhar a entrega, atestar o recebimento dos equipamentos e comunicar quaisquer ocorrências à Administração.',
      'tr-input-sancoes': 'O descumprimento total ou parcial das obrigações assumidas sujeitará a contratada às sanções previstas no Capítulo II do Título IV da Lei nº 14.133/2021, garantido o contraditório e a ampla defesa.',
      'tr-input-anexos': 'Anexo I - Especificações Técnicas Mínimas dos Notebooks.\nAnexo II - Minuta do Contrato.',
    },
  },
  {
    id: 'tr-security-services',
    name: 'Serviços de Vigilância Patrimonial',
    description: 'Modelo para contratar serviços continuados de vigilância armada e/ou desarmada.',
    type: 'tr',
    sections: {
        'tr-input-objeto': 'Contratação de empresa especializada para a prestação de serviços continuados de vigilância patrimonial armada, visando à cobertura dos postos e escalas definidos neste Termo de Referência, para garantir a segurança das instalações, servidores e bens da instituição.',
        'tr-input-justificativa': 'A contratação é essencial para assegurar a integridade do patrimônio público e a segurança da comunidade interna, prevenindo furtos, roubos e outros atos ilícitos. A necessidade está fundamentada no ETP nº YYY/2024, que analisou os riscos e a vulnerabilidade das instalações.',
        'tr-input-execucao': 'Os serviços serão prestados de forma ininterrupta, 24 horas por dia, 7 dias por semana, incluindo feriados, através da alocação de 3 (três) postos de vigilância armada, em regime de escala 12x36h. A empresa deverá fornecer profissionais devidamente habilitados, uniformizados e equipados com colete balístico, rádio comunicador e armamento legalizado.',
        'tr-input-obrigacoes': '**Obrigações da CONTRATADA:**\n- Manter a cobertura completa de todos os postos de serviço, sem interrupções.\n- Assegurar que todos os vigilantes possuam a Carteira Nacional de Vigilante (CNV) e cursos de reciclagem em dia.\n- Cumprir rigorosamente a legislação trabalhista e previdenciária aplicável aos seus empregados.\n\n**Obrigações da CONTRATANTE:**\n- Proporcionar as condições adequadas para a execução dos serviços nos postos.\n- Efetuar os pagamentos mensais mediante a comprovação da regularidade fiscal e trabalhista da contratada.',
        'tr-input-habilitacao': 'A licitante deverá possuir Autorização de Funcionamento e Certificado de Segurança expedidos pela Polícia Federal. Deverá comprovar, mediante atestados, ter executado serviços de vigilância patrimonial armada por um período mínimo de 3 anos.',
        'tr-input-pagamento': 'O pagamento será mensal, realizado após o término do mês de prestação dos serviços e condicionado à apresentação da documentação comprobatória de quitação das obrigações trabalhistas e previdenciárias, conforme a IN SEGES/MP nº 5/2017.',
        'tr-input-fiscalizacao': 'A fiscalização do contrato será exercida por um gestor e fiscais designados, que verificarão a assiduidade, a apresentação pessoal dos vigilantes, o estado dos equipamentos e o cumprimento das normas de segurança estabelecidas.',
        'tr-input-sancoes': 'Falhas na cobertura dos postos, apresentação de vigilantes desarmados ou sem a devida documentação, entre outras irregularidades, sujeitarão a contratada a advertências, multas e, em caso de reincidência, à rescisão contratual, conforme Lei nº 14.133/21.',
        'tr-input-anexos': 'Anexo I - Planilha de Custos e Formação de Preços.\nAnexo II - Relação de Postos e Escalas.',
    },
  },
];
