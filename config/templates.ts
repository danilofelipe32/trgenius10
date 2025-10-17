import { Template } from '../types';

export const etpTemplates: Template[] = [
  {
    id: 'etp-ti-equipment',
    name: 'Aquisição de Equipamentos de TI',
    description: 'Template para compra de computadores, notebooks, servidores ou outros equipamentos de informática.',
    type: 'etp',
    sections: {
      'etp-1-introducao': 'Este Estudo Técnico Preliminar (ETP) tem como objetivo planejar e fundamentar a aquisição de novos equipamentos de tecnologia da informação para [descrever a finalidade, ex: modernizar o parque tecnológico, atender a novos postos de trabalho].',
      'etp-2-necessidade': 'A necessidade da contratação surge da [descrever o problema, ex: obsolescência dos equipamentos atuais, aumento da demanda, necessidade de maior desempenho para novos softwares].',
    },
  },
  {
    id: 'etp-cleaning-services',
    name: 'Contratação de Serviços de Limpeza',
    description: 'Template para contratar serviços continuados de limpeza, conservação e higienização de áreas.',
    type: 'etp',
    sections: {
      'etp-1-introducao': 'Este ETP visa planejar a contratação de serviços continuados de limpeza, conservação e higienização para as instalações de [nome do órgão/entidade], visando manter um ambiente salubre e adequado ao trabalho.',
      'etp-2-necessidade': 'A contratação é essencial para a manutenção da higiene e saúde ambiental das dependências, em conformidade com as normas sanitárias, proporcionando um ambiente de trabalho adequado para servidores e para o atendimento ao público.',
    },
  },
  {
    id: 'etp-custom-software',
    name: 'Desenvolvimento de Software Sob Demanda',
    description: 'Contratação de empresa para desenvolver um sistema web customizado para gestão de processos internos.',
    type: 'etp',
    sections: {
      'etp-1-introducao': 'Planejamento para a contratação de empresa especializada para o desenvolvimento de um sistema web customizado para [descrever a finalidade do sistema, ex: gestão de processos administrativos internos].',
      'etp-2-necessidade': 'A necessidade decorre da ausência de uma solução de software no mercado que atenda plenamente às especificidades dos processos de [descrever o processo]. Os sistemas atuais são manuais ou descentralizados, gerando ineficiência e falta de rastreabilidade.',
    },
  },
  {
    id: 'etp-consulting-services',
    name: 'Serviços de Consultoria Especializada',
    description: 'Template para contratar consultoria em gestão estratégica, financeira ou de processos.',
    type: 'etp',
    sections: {
      'etp-1-introducao': 'Este ETP planeja a contratação de serviços de consultoria especializada para [descrever a área da consultoria, ex: otimização de processos de negócio, planejamento estratégico, gestão financeira].',
      'etp-2-necessidade': 'A contratação é necessária devido à falta de expertise interna para realizar um diagnóstico aprofundado e propor soluções inovadoras para [descrever o desafio a ser resolvido pela consultoria].',
    },
  },
  {
    id: 'etp-public-event',
    name: 'Organização de Evento Público',
    description: 'Planejamento para a contratação de empresa para organizar uma conferência, seminário ou evento institucional.',
    type: 'etp',
    sections: {
      'etp-1-introducao': 'O presente estudo visa planejar a contratação de empresa especializada na organização e execução de [nome do evento], a ser realizado em [data/período], com público estimado de [número] participantes.',
      'etp-2-necessidade': 'A realização do evento é fundamental para [descrever o objetivo do evento, ex: a capacitação de servidores, a divulgação de resultados, o fortalecimento de relações institucionais]. A estrutura interna não possui pessoal e expertise para a complexa logística que o evento demanda.',
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
      'tr-1-objeto': 'Aquisição de [quantidade] notebooks, com garantia mínima de [tempo], conforme especificações técnicas detalhadas no Anexo I.',
      'tr-2-justificativa': 'A contratação se justifica pela necessidade de substituição de equipamentos defasados e para atender a novos postos de trabalho, conforme apontado no Estudo Técnico Preliminar nº [número do ETP].',
    },
  },
  {
    id: 'tr-surveillance-services',
    name: 'Serviços de Vigilância Patrimonial',
    description: 'Modelo para contratar serviços continuados de vigilância armada e/ou desarmada.',
    type: 'tr',
    sections: {
      'tr-1-objeto': 'Contratação de empresa especializada para a prestação de serviços continuados de vigilância patrimonial, [armada/desarmada], para garantir a segurança das instalações, servidores e público em [local].',
      'tr-2-justificativa': 'A contratação é indispensável para a proteção do patrimônio público e para garantir a integridade física das pessoas que circulam nas dependências do órgão, inibindo ações criminosas.',
    },
  },
  {
    id: 'tr-saas',
    name: 'Assinatura de Serviços em Nuvem (SaaS)',
    description: 'Modelo para contratar uma plataforma de software como serviço, como CRM, ERP ou ferramenta de colaboração.',
    type: 'tr',
    sections: {
      'tr-1-objeto': 'Contratação de solução de Software como Serviço (SaaS) para [finalidade do software, ex: gestão de relacionamento com o cidadão (CRM)], incluindo serviços de implantação, treinamento e suporte técnico, para [número] usuários.',
      'tr-2-justificativa': 'A contratação visa modernizar e centralizar [processo a ser melhorado], substituindo soluções legadas ou processos manuais, resultando em maior eficiência e transparência, conforme ETP nº [número].',
    },
  },
  {
    id: 'tr-fleet-outsourcing',
    name: 'Terceirização de Frota de Veículos',
    description: 'Contratação de serviços de locação de veículos com manutenção e seguro inclusos para uso institucional.',
    type: 'tr',
    sections: {
      'tr-1-objeto': 'Contratação de empresa para prestação de serviço de locação de veículos, [com/sem] motorista, incluindo manutenção preventiva e corretiva, seguro e documentação, para atender às necessidades de transporte institucional.',
      'tr-2-justificativa': 'A terceirização da frota se mostra mais vantajosa economicamente do que a manutenção de frota própria, eliminando custos com aquisição, manutenção, seguro e gestão de veículos, permitindo que a Administração foque em sua atividade-fim.',
    },
  },
  {
    id: 'tr-specialized-training',
    name: 'Capacitação e Treinamento Especializado',
    description: 'Contratação de curso ou treinamento específico para servidores, com instrutor e material didático.',
    type: 'tr',
    sections: {
      'tr-1-objeto': 'Contratação de curso de capacitação em [tema do curso], com carga horária de [horas], para um total de [número] servidores, incluindo material didático e certificação.',
      'tr-2-justificativa': 'A capacitação é fundamental para o desenvolvimento de competências essenciais para [descrever a importância do treinamento para o órgão], alinhado ao Plano de Desenvolvimento de Pessoas (PDP) desta instituição.',
    },
  },
];