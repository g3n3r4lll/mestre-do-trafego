export const strategyJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    verdict: { type: 'string', enum: ['APROVAR', 'TESTAR', 'BLOQUEAR'] },
    verdictReason: { type: 'string' },
    executiveSummary: { type: 'string' },
    campaign: {
      type: 'object', additionalProperties: false,
      properties: {
        platform: { type: 'string' }, objective: { type: 'string' }, campaignType: { type: 'string' },
        campaignName: { type: 'string' }, conversionEvent: { type: 'string' }, budgetStrategy: { type: 'string' },
        dailyBudget: { type: 'number' }, testDurationDays: { type: 'integer' }, bidStrategy: { type: 'string' },
        attribution: { type: 'string' }, placements: { type: 'string' },
      },
      required: ['platform','objective','campaignType','campaignName','conversionEvent','budgetStrategy','dailyBudget','testDurationDays','bidStrategy','attribution','placements'],
    },
    offer: {
      type: 'object', additionalProperties: false,
      properties: {
        diagnosis: { type: 'string' }, promise: { type: 'string' }, mechanism: { type: 'string' },
        objections: { type: 'array', items: { type: 'string' } }, guarantee: { type: 'string' },
      }, required: ['diagnosis','promise','mechanism','objections','guarantee'],
    },
    audiences: {
      type: 'array', minItems: 2, maxItems: 5,
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          name: { type: 'string' }, type: { type: 'string' }, description: { type: 'string' },
          include: { type: 'array', items: { type: 'string' } }, exclude: { type: 'array', items: { type: 'string' } }, notes: { type: 'string' },
        }, required: ['name','type','description','include','exclude','notes'],
      },
    },
    ads: {
      type: 'array', minItems: 3, maxItems: 5,
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          name: { type: 'string' }, angle: { type: 'string' }, primaryText: { type: 'string' },
          headline: { type: 'string' }, description: { type: 'string' }, cta: { type: 'string' },
        }, required: ['name','angle','primaryText','headline','description','cta'],
      },
    },
    creatives: {
      type: 'array', minItems: 3, maxItems: 5,
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          name: { type: 'string' }, format: { type: 'string' }, hook: { type: 'string' },
          script: { type: 'array', items: { type: 'string' } }, visualDirection: { type: 'string' }, imagePrompt: { type: 'string' },
        }, required: ['name','format','hook','script','visualDirection','imagePrompt'],
      },
    },
    implementationSteps: {
      type: 'array', minItems: 10, maxItems: 30,
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          order: { type: 'integer' }, phase: { type: 'string' }, path: { type: 'string' },
          action: { type: 'string' }, exactValue: { type: 'string' }, validation: { type: 'string' },
        }, required: ['order','phase','path','action','exactValue','validation'],
      },
    },
    trackingChecklist: { type: 'array', minItems: 4, maxItems: 15, items: { type: 'string' } },
    optimizationRules: {
      type: 'object', additionalProperties: false,
      properties: {
        first72Hours: { type: 'array', items: { type: 'string' } }, killRules: { type: 'array', items: { type: 'string' } },
        scaleRules: { type: 'array', items: { type: 'string' } }, remarketing: { type: 'array', items: { type: 'string' } },
      }, required: ['first72Hours','killRules','scaleRules','remarketing'],
    },
    landingOrWhatsApp: {
      type: 'object', additionalProperties: false,
      properties: {
        headline: { type: 'string' }, structure: { type: 'array', items: { type: 'string' } },
        followUp: { type: 'array', items: { type: 'string' } },
      }, required: ['headline','structure','followUp'],
    },
    risks: { type: 'array', minItems: 2, maxItems: 10, items: { type: 'string' } },
    namingConvention: { type: 'string' },
  },
  required: ['verdict','verdictReason','executiveSummary','campaign','offer','audiences','ads','creatives','implementationSteps','trackingChecklist','optimizationRules','landingOrWhatsApp','risks','namingConvention'],
};
