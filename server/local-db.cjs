const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs'),path=require('node:path');
function localDatabase(filename){
 const db=new DatabaseSync(filename);db.exec('PRAGMA foreign_keys=ON');
 db.exec('CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)');
 for(const name of fs.readdirSync(path.join(__dirname,'../drizzle')).filter(x=>x.endsWith('.sql')).sort()) {
  if(!db.prepare('SELECT name FROM local_migrations WHERE name=?').get(name)){db.exec('BEGIN');try{db.exec(fs.readFileSync(path.join(__dirname,'../drizzle',name),'utf8'));db.prepare('INSERT INTO local_migrations VALUES (?)').run(name);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}}
 }
 const prepare=(sql)=>{let args=[];return {bind(...values){args=values;return this},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){const out=db.prepare(sql).run(...args);return {meta:{changes:Number(out.changes)}}},_run(){return db.prepare(sql).run(...args)}}};
 return {prepare,async batch(items){db.exec('BEGIN');try{const out=items.map(x=>({meta:{changes:Number(x._run().changes)}}));db.exec('COMMIT');return out;}catch(e){db.exec('ROLLBACK');throw e;}},close(){db.close()}};
}
module.exports={localDatabase};
