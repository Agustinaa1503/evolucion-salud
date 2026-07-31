/**
 * Catálogo de imágenes del sitio (Unsplash, URLs estables).
 * Cada recurso tiene un set de variantes de tamaño para next/image.
 */

const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const img = {
  hero: u('photo-1506126613408-eca07ce68773', 2000),
  heroBanner: u('photo-1508672019048-805c876b67e2', 2000),
  pineMindful: u('photo-1499209974431-9dddcece7f88', 1600),
  pineNature: u('photo-1441974231531-c6227db76b6e', 1600),
  pineWater: u('photo-1437482078695-73f5ca6c96e2', 1600),
  pineSleep: u('photo-1541781774459-bb2af2f05b55', 1600),
  team: u('photo-1521737604893-d14cc237f11d', 1600),
  teamMeet: u('photo-1556761175-5973dc0f32e7', 1600),
  podcast: u('photo-1590602847861-f357e9332bbc', 1600),
  library: u('photo-1507842217343-583bb7270b66', 1600),
  blog: u('photo-1499750310107-5fef28a66643', 1600),
  care: u('photo-1576091160399-112ba8d25d1d', 1600),
  seedling: u('photo-1507124484497-b7f446e65519', 1200),
  mountain: u('photo-1470071459604-3b5ec3a7fe05', 1600),
  contact: u('photo-1573164713988-8665fc963095', 1600),
  newsletter: u('photo-1495020689067-958852a7765e', 1600),
  checklist: u('photo-1507124484497-b7f446e65519', 1200),
};

export const blogImages = [
  u('photo-1506126613408-eca07ce68773'),
  u('photo-1499209974431-9dddcece7f88'),
  u('photo-1441974231531-c6227db76b6e'),
  u('photo-1437482078695-73f5ca6c96e2'),
  u('photo-1470071459604-3b5ec3a7fe05'),
  u('photo-1541781774459-bb2af2f05b55'),
];

export function blogImage(index: number): string {
  return blogImages[index % blogImages.length];
}

export function courseImage(index: number): string {
  const pool = [
    u('photo-1499209974431-9dddcece7f88'),
    u('photo-1508672019048-805c876b67e2'),
    u('photo-1441974231531-c6227db76b6e'),
    u('photo-1541781774459-bb2af2f05b55'),
  ];
  return pool[index % pool.length];
}
