import { CABINS, cabinLocalToWorld } from './cabins';
import { InteractablePoint, InventoryItemDef, InventoryItemId, InventorySlotState } from './types';
import { VILLAGES } from './villages';

export const INVENTORY_CATALOG: Record<InventoryItemId, InventoryItemDef> = {
  lantern: {
    id: 'lantern',
    name: 'Lanterna de Expedição',
    category: 'Equipamento',
    description: 'Ilumina trilhas escuras durante a noite na selva. Pressione F para ligar ou desligar.',
    usable: false,
    equippable: true,
  },
  torch: {
    id: 'torch',
    name: 'Tocha da Selva',
    category: 'Equipamento',
    description: 'Tocha artesanal de chama quente. Pode ser feita com 2 Madeiras Firmes e 1 Pedra de Sílex.',
    usable: false,
    equippable: true,
  },
  compass: {
    id: 'compass',
    name: 'Bússola de Latão',
    category: 'Equipamento',
    description: 'Instrumento de navegação que orienta o explorador rumo às relíquias e marcos.',
    usable: false,
    equippable: true,
  },
  axe: {
    id: 'axe',
    name: 'Machado de Exploração',
    category: 'Arma',
    description: 'Ferramenta robusta de aço. Equipe para se defender com golpes pesados (tecla Q).',
    usable: false,
    equippable: true,
  },
  sword: {
    id: 'sword',
    name: 'Espada da Selva',
    category: 'Arma',
    description: 'Lâmina longa e equilibrada ideal para afugentar predadores noturnos rapidamente (tecla Q).',
    usable: false,
    equippable: true,
  },
  medkit: {
    id: 'medkit',
    name: 'Kit Médico',
    category: 'Consumível',
    description: 'Bandagens e antissépticos de campo. Ao usar, restaura 45 pontos de vida imediatamente.',
    usable: true,
    equippable: false,
  },
  rations: {
    id: 'rations',
    name: 'Comida e Água',
    category: 'Consumível',
    description: 'Cantil de água fresca e provisões secas. Restaura 25 de vida e dá agilidade por 14 segundos.',
    usable: true,
    equippable: false,
  },
  raw_meat: {
    id: 'raw_meat',
    name: 'Carne Crua',
    category: 'Consumível',
    description: 'Carne fresca obtida ao abater animais na selva. Asse na fogueira para dobrar o benefício ou use crua (+30 Vida).',
    usable: true,
    equippable: false,
  },
  cooked_meat: {
    id: 'cooked_meat',
    name: 'Carne Assada',
    category: 'Consumível',
    description: 'Carne preparada na brasa da fogueira. Restaura 55 pontos de vida e concede energia por 20 segundos.',
    usable: true,
    equippable: false,
  },
  sweet_berry: {
    id: 'sweet_berry',
    name: 'Bagas Doces',
    category: 'Consumível',
    description: 'Bagas silvestres suculentas colhidas em moitas da selva. Restaura 18 de vida e dá energia por 12 segundos.',
    usable: true,
    equippable: false,
  },
  fruit: {
    id: 'fruit',
    name: 'Fruta Tropical',
    category: 'Consumível',
    description: 'Fruto doce e hidratante da mata. Restaura 12 de vida e aumenta a agilidade por 14 segundos.',
    usable: true,
    equippable: false,
  },
  herb: {
    id: 'herb',
    name: 'Erva da Clareira',
    category: 'Consumível',
    description: 'Folha medicinal aromática. Restaura 18 de vida e concede fôlego extra por 10 segundos.',
    usable: true,
    equippable: false,
  },
  rope: {
    id: 'rope',
    name: 'Corda Resistente',
    category: 'Recurso',
    description: 'Corda trançada de fibra natural. Combine com 1 Erva da Clareira para criar uma Atadura (+35 Vida).',
    usable: false,
    equippable: false,
  },
  wood: {
    id: 'wood',
    name: 'Madeira Firme',
    category: 'Recurso',
    description: 'Galhos secos e resistentes recolhidos na mata. Úteis para montar uma tocha.',
    usable: false,
    equippable: false,
  },
  stone: {
    id: 'stone',
    name: 'Pedra de Sílex',
    category: 'Recurso',
    description: 'Pedra lisa de leito de rio capaz de gerar faíscas para acender tochas.',
    usable: false,
    equippable: false,
  },
};

export function createInitialInventory(): InventorySlotState[] {
  return [
    { id: 'lantern', quantity: 1, equipped: true },
    { id: 'compass', quantity: 1, equipped: true },
    { id: 'rations', quantity: 1, equipped: false },
  ];
}

export function createWorldGatherables(): InteractablePoint[] {
  const nodes: Array<{
    id: string;
    itemId: InventoryItemId;
    x: number;
    z: number;
    yOffset?: number;
    propStyle?: 'crate';
  }> = [
    // Near central clearing & starting trails
    { id: 'gather-fruit-1', itemId: 'fruit', x: -5.2, z: 5.5 },
    { id: 'gather-wood-1', itemId: 'wood', x: 7.4, z: 3.8 },
    { id: 'gather-stone-1', itemId: 'stone', x: -7.5, z: -2.5 },
    { id: 'gather-herb-1', itemId: 'herb', x: 2.2, z: -8.2 },
    { id: 'gather-rope-1', itemId: 'rope', x: -3.4, z: 7.8 },

    // Trail toward Altar das Ruínas (NW)
    { id: 'gather-wood-2', itemId: 'wood', x: -13.5, z: -10.8 },
    { id: 'gather-stone-2', itemId: 'stone', x: -20.5, z: -16.5 },
    { id: 'gather-herb-2', itemId: 'herb', x: -26.5, z: -29.5 },
    { id: 'gather-rations-1', itemId: 'rations', x: -31.0, z: -20.0 },

    // Trail toward Mirante da Pedra Alta (NE)
    { id: 'gather-fruit-2', itemId: 'fruit', x: 14.2, z: -12.0 },
    { id: 'gather-stone-3', itemId: 'stone', x: 21.5, z: -21.0 },
    { id: 'gather-wood-3', itemId: 'wood', x: 11.0, z: -31.5 },
    { id: 'gather-rope-2', itemId: 'rope', x: 29.5, z: -25.0 },

    // Trail & shore of Riacho Esmeralda (SE)
    { id: 'gather-stone-4', itemId: 'stone', x: 31.5, z: 28.5 },
    { id: 'gather-herb-3', itemId: 'herb', x: 23.0, z: 15.0 },
    { id: 'gather-fruit-3', itemId: 'fruit', x: 38.5, z: 17.5 },
    { id: 'gather-medkit-outdoor', itemId: 'medkit', x: 25.0, z: 29.0 },

    // Trail toward Bosque das Palmeiras (SW) & Santuário da Raiz (S)
    { id: 'gather-fruit-4', itemId: 'fruit', x: -24.5, z: 24.0 },
    { id: 'gather-wood-4', itemId: 'wood', x: -12.0, z: 13.5 },
    { id: 'gather-herb-4', itemId: 'herb', x: -11.5, z: 35.5 },
    { id: 'gather-wood-5', itemId: 'wood', x: 13.5, z: 34.0 },
    { id: 'gather-stone-5', itemId: 'stone', x: -3.2, z: 40.2 },

    // Expanded deep-jungle exploration pickups
    { id: 'gather-axe-wild', itemId: 'axe', x: -64, z: -38 },
    { id: 'gather-rope-wild', itemId: 'rope', x: 66, z: -22 },
    { id: 'gather-rations-wild', itemId: 'rations', x: 5, z: -68 },
    { id: 'gather-herb-wild', itemId: 'herb', x: -28, z: 68 },
    { id: 'gather-wood-wild', itemId: 'wood', x: 74, z: 16 },
    { id: 'gather-stone-wild', itemId: 'stone', x: -72, z: 18 },

    // Moitas com Bagas Doces visíveis espalhadas por trilhas, clareiras e cabanas
    { id: 'gather-berry-1', itemId: 'sweet_berry', x: 4.8, z: 6.2 },
    { id: 'gather-berry-2', itemId: 'sweet_berry', x: -8.6, z: -2.2 },
    { id: 'gather-berry-3', itemId: 'sweet_berry', x: -13.2, z: -8.8 },
    { id: 'gather-berry-4', itemId: 'sweet_berry', x: -24.0, z: -21.5 },
    { id: 'gather-berry-5', itemId: 'sweet_berry', x: 11.4, z: -9.5 },
    { id: 'gather-berry-6', itemId: 'sweet_berry', x: 24.5, z: -20.5 },
    { id: 'gather-berry-7', itemId: 'sweet_berry', x: 14.5, z: 10.2 },
    { id: 'gather-berry-8', itemId: 'sweet_berry', x: 26.2, z: 21.5 },
    { id: 'gather-berry-9', itemId: 'sweet_berry', x: -12.4, z: 10.6 },
    { id: 'gather-berry-10', itemId: 'sweet_berry', x: -21.8, z: 24.6 },
    { id: 'gather-berry-11', itemId: 'sweet_berry', x: -5.4, z: 36.2 },
    { id: 'gather-berry-12', itemId: 'sweet_berry', x: 11.5, z: 35.4 },
    { id: 'gather-berry-13', itemId: 'sweet_berry', x: -2.5, z: -31.8 },
    { id: 'gather-berry-14', itemId: 'sweet_berry', x: 41.0, z: 3.5 },
    { id: 'gather-berry-15', itemId: 'sweet_berry', x: -42.0, z: -6.5 },
  ];

  // Add supply crates across the 3 scattered villages
  const villageCrates: Record<string, Array<{ itemId: InventoryItemId; lx: number; lz: number }>> = {
    'village-nascente': [
      { itemId: 'rations', lx: -4.2, lz: 1.8 },
      { itemId: 'wood', lx: 4.2, lz: 2.2 },
      { itemId: 'fruit', lx: -0.6, lz: -5.2 },
    ],
    'village-vale': [
      { itemId: 'medkit', lx: -4.6, lz: 1.4 },
      { itemId: 'rope', lx: 4.4, lz: 1.8 },
      { itemId: 'rations', lx: 0.4, lz: -5.2 },
    ],
    'village-norte': [
      { itemId: 'cooked_meat', lx: -4.0, lz: 1.6 },
      { itemId: 'torch', lx: 4.0, lz: 2.0 },
      { itemId: 'stone', lx: 0.2, lz: -5.4 },
    ],
  };

  VILLAGES.forEach((v) => {
    const crates = villageCrates[v.id] ?? [];
    crates.forEach((c, idx) => {
      nodes.push({
        id: `gather-${v.id}-crate-${idx}`,
        itemId: c.itemId,
        x: v.x + c.lx,
        z: v.z + c.lz,
        propStyle: 'crate',
      });
    });
  });

  // Add survival items ONLY inside cabins marked with hasLoot = true (others remain purely decorative)
  const cabinLootLayout: Record<
    string,
    Array<{ itemId: InventoryItemId; lx: number; lz: number; yOffset: number }>
  > = {
    'cabin-trail': [
      { itemId: 'axe', lx: -0.35, lz: -0.25, yOffset: 0.16 },
      { itemId: 'rations', lx: 1.55, lz: -1.3, yOffset: 0.96 },
      { itemId: 'rope', lx: 0.55, lz: 0.75, yOffset: 0.16 },
    ],
    'cabin-north': [
      { itemId: 'medkit', lx: 1.55, lz: -1.3, yOffset: 0.96 },
      { itemId: 'sword', lx: -0.25, lz: -0.15, yOffset: 0.16 },
      { itemId: 'torch', lx: -0.85, lz: 0.65, yOffset: 0.16 },
    ],
    'cabin-cedars': [
      { itemId: 'medkit', lx: 1.55, lz: -1.3, yOffset: 0.96 },
      { itemId: 'rations', lx: -0.3, lz: 0.2, yOffset: 0.16 },
      { itemId: 'wood', lx: 0.65, lz: 0.8, yOffset: 0.16 },
    ],
    'cabin-forester': [
      { itemId: 'sword', lx: 1.55, lz: -1.3, yOffset: 0.96 },
      { itemId: 'medkit', lx: -0.45, lz: -0.25, yOffset: 0.16 },
      { itemId: 'lantern', lx: 0.5, lz: 0.45, yOffset: 0.16 },
      { itemId: 'stone', lx: -0.25, lz: 0.9, yOffset: 0.16 },
    ],
  };

  CABINS.forEach((cab) => {
    if (!cab.hasLoot) return;
    const items = cabinLootLayout[cab.id] ?? [];
    items.forEach((entry, idx) => {
      const worldPt = cabinLocalToWorld(cab, entry.lx, entry.lz);
      nodes.push({
        id: `gather-${cab.id}-${entry.itemId}-${idx}`,
        itemId: entry.itemId,
        x: worldPt.x,
        z: worldPt.z,
        yOffset: entry.yOffset,
      });
    });
  });

  return nodes.map((n) => {
    const def = INVENTORY_CATALOG[n.itemId];
    return {
      id: n.id,
      kind: 'gatherable',
      itemId: n.itemId,
      title: def.name,
      subtitle: def.description,
      x: n.x,
      z: n.z,
      yOffset: n.yOffset,
      propStyle: n.propStyle,
      radius: 2.2,
      collected: false,
    };
  });
}
