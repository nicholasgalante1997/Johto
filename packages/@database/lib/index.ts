import {
  getPool as postgres_getPool,
  insertSet as postgres_insertSet,
  insertCard as postgres_insertCard
} from './postgres';
import * as sqlite from './sqlite';
import {
  closeNeo4jDriver,
  getNeo4jDriver,
  readFromGraph as neo4j_readFromGraph,
  writeToGraph as neo4j_writeToGraph,
  insertCard as neo4j_insertCard,
  insertSet as neo4j_insertSet,
  setupGraphNodeConstraints as neo4j_setupGraphNodeConstraints
} from './neo4j';

const postgres = {
  getPool: postgres_getPool,
  insertSet: postgres_insertSet,
  insertCard: postgres_insertCard
};

const neo4j = {
  getNeo4jDriver: getNeo4jDriver,
  readFromGraph: neo4j_readFromGraph,
  writeToGraph: neo4j_writeToGraph,
  insertCard: neo4j_insertCard,
  insertSet: neo4j_insertSet,
  setupGraphNodeConstraints: neo4j_setupGraphNodeConstraints,
  closeNeo4jDriver: closeNeo4jDriver
};

export { neo4j, postgres, sqlite };
