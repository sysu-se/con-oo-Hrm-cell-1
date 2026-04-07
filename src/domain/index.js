// src/domain/index.js
import { Sudoku } from './Sudoku';
import { Game } from './Game';

/**
 * @param {number[][]} input
 * @returns {Sudoku}
 */
export function createSudoku(input) {
  return new Sudoku(input);
}

/**
 * @param {any} json
 * @returns {Sudoku}
 */
export function createSudokuFromJSON(json) {
  return Sudoku.fromJSON(json);
}

/**
 * @param {{sudoku:Sudoku}} param0
 * @returns {Game}
 */
export function createGame({ sudoku }) {
  return new Game(sudoku);
}

/**
 * @param {any} json
 * @returns {Game}
 */
export function createGameFromJSON(json) {
  return Game.fromJSON(json);
}