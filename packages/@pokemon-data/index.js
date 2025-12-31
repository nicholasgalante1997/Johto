import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function getSets() {
  return Bun.file(path.resolve(__dirname, 'data/sets.json'))
    .json()
    .then((json) => json.data);
}

export async function getSet(setId) {
  const sets = await getSets();
  const matches = sets.filter((set) => set.id === setId);
  return matches.length > 0 ? matches[0] : null;
}

export async function getAllSetIds() {
  const sets = await getSets();
  return sets.map((set) => set.id);
}

export async function getCardsInSet(setId) {
  const cpath = path.resolve(__dirname, `data/cards/${setId}.d/cards.json`);
  try {
    const json = await Bun.file(cpath).json();
    return json.data;
  } catch (e) {
    if (e?.code === 'ENOENT') {
      console.warn(`No cards found for set ID: ${setId}`);
      return [];
    }

    throw e;
  }
}
