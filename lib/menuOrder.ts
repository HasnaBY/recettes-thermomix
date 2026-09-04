export type MenuItem = { recipe_id: string; recipe_title: string }
export type MenuWithOrder = {
  plats?: MenuItem[]
  desserts?: MenuItem[]
  boissons?: MenuItem[]
  pains?: MenuItem[]
  entrees?: MenuItem[]
  plat_order?: string[]
  accomp_order?: string[]
  notes?: string[]
}

export function getAllAccompaniments(menu: MenuWithOrder): MenuItem[] {
  return [
    ...(menu.desserts ?? []),
    ...(menu.boissons ?? []),
    ...(menu.entrees ?? []),
    ...(menu.pains ?? []),
  ]
}

export function getOrderedPlats(menu: MenuWithOrder): MenuItem[] {
  const plats = menu.plats ?? []
  if (!menu.plat_order || menu.plat_order.length === 0) return plats
  const map = new Map(plats.map((p) => [p.recipe_id, p]))
  const ordered = menu.plat_order.map((id) => map.get(id)).filter((p): p is MenuItem => Boolean(p))
  plats.forEach((p) => {
    if (!ordered.find((o) => o.recipe_id === p.recipe_id)) ordered.push(p)
  })
  return ordered
}

export function getOrderedAccompaniments(menu: MenuWithOrder): MenuItem[] {
  const all = getAllAccompaniments(menu)
  if (!menu.accomp_order || menu.accomp_order.length === 0) return all
  const map = new Map(all.map((p) => [p.recipe_id, p]))
  const ordered = menu.accomp_order.map((id) => map.get(id)).filter((p): p is MenuItem => Boolean(p))
  all.forEach((p) => {
    if (!ordered.find((o) => o.recipe_id === p.recipe_id)) ordered.push(p)
  })
  return ordered
}

export function initOrders(menu: MenuWithOrder): MenuWithOrder {
  return {
    ...menu,
    plat_order: (menu.plats ?? []).map((p) => p.recipe_id),
    accomp_order: getAllAccompaniments(menu).map((p) => p.recipe_id),
  }
}