import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const events = sqliteTable('ops_events', {
 id:text('id').primaryKey(), operatorHash:text('operator_hash').notNull(), name:text('name').notNull(), date:text('date').notNull(), capacity:integer('capacity').notNull(), created:text('created').notNull()
});
export const lots = sqliteTable('ops_lots', {
 id:text('id').primaryKey(), eventId:text('event_id').notNull().references(()=>events.id), name:text('name').notNull(), capacity:integer('capacity').notNull(), price:integer('price').notNull(), accessible:integer('accessible').notNull(), open:integer('open').notNull(), updated:text('updated').notNull()
},t=>[index('idx_lots_event').on(t.eventId)]);
export const passes = sqliteTable('ops_passes', {
 tokenHash:text('token_hash').primaryKey(), eventId:text('event_id').notNull().references(()=>events.id), name:text('name').notNull(), lotId:text('lot_id').references(()=>lots.id), price:integer('price').notNull(), status:text('status').notNull(), checked:integer('checked').notNull(), parking:text('parking').notNull(), created:text('created').notNull(), updated:text('updated').notNull()
},t=>[index('idx_passes_event_status').on(t.eventId,t.status),index('idx_passes_lot_status').on(t.lotId,t.status,t.parking)]);
