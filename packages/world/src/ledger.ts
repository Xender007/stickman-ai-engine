/**
 * Persistent world state (plan section 5.3). Entities never vanish or appear by accident:
 * every change is an event with a cause, and some quantities are monotonic.
 */
export type Damage = 'intact' | 'dented' | 'wrecked';
const DAMAGE_ORDER: Damage[] = ['intact', 'dented', 'wrecked'];

export interface EntityState {
  id: string;
  asset: string;
  position: [number, number, number]; // metres, y up
  rotationZ: number; // radians (2.5D: rotation about the depth axis)
  damage: Damage;
  wetness: number; // 0..1
  present: boolean; // false = off-screen/not yet arrived, still in the world
}

export type LedgerEvent =
  | { kind: 'arrive'; id: string; cause: string }
  | { kind: 'damage'; id: string; to: Damage; cause: string }
  | { kind: 'repair'; id: string; cause: string }
  | { kind: 'wet'; id: string; wetness: number; cause: string }
  | { kind: 'move'; id: string; position: [number, number, number]; rotationZ: number };

export class WorldLedger {
  private readonly entities = new Map<string, EntityState>();
  readonly log: LedgerEvent[] = [];

  constructor(initial: EntityState[]) {
    initial.forEach((e) => this.entities.set(e.id, { ...e }));
  }

  get(id: string): EntityState {
    const e = this.entities.get(id);
    if (!e) throw new Error(`unknown entity ${id}: a cut must not spawn an entity that was never in the world`);
    return e;
  }

  snapshot(): EntityState[] {
    return [...this.entities.values()].sort((a, b) => a.id.localeCompare(b.id)).map((e) => ({ ...e, position: [...e.position] as [number, number, number] }));
  }

  apply(ev: LedgerEvent): void {
    const e = this.get(ev.id);
    switch (ev.kind) {
      case 'arrive':
        if (e.present) throw new Error(`${ev.id} is already present`);
        if (!ev.cause) throw new Error('arrival needs a cause');
        e.present = true;
        break;
      case 'damage':
        if (!ev.cause) throw new Error('damage needs a cause');
        if (DAMAGE_ORDER.indexOf(ev.to) <= DAMAGE_ORDER.indexOf(e.damage)) {
          throw new Error(`${ev.id}: damage can only get worse (${e.damage} -> ${ev.to}); use a repair event`);
        }
        e.damage = ev.to;
        break;
      case 'repair':
        if (!ev.cause) throw new Error('repair needs a cause');
        e.damage = 'intact';
        break;
      case 'wet':
        if (ev.wetness < 0 || ev.wetness > 1) throw new Error('wetness must be 0..1');
        if (!ev.cause) throw new Error('wetness change needs a cause');
        e.wetness = ev.wetness;
        break;
      case 'move':
        e.position = ev.position;
        e.rotationZ = ev.rotationZ;
        break;
    }
    this.log.push(ev);
  }
}
