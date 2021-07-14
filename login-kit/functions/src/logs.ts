/**
 * Copyright 2021 Snap, Inc.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/**
 * Generates an info log
 * @param {any} message message to log
 * @param {any[]} optionalParams additinla params to log
 */
export function logInfo(message: any, ...optionalParams: any[]): void {
  const logMessage = `👻[Info] ${message}`;
  console.info(logMessage, optionalParams);
}

/**
 * Generates a warn log
 * @param {any} message message to log
 * @param {any[]} optionalParams additinla params to log
 */
export function logWarning(message: any, ...optionalParams: any[]): void {
  const logMessage = `👻[Warn] ${message}`;
  console.warn(logMessage, optionalParams);
}

/**
 * Generate an error log
 * @param {any} message message to log
 * @param {any[]} optionalParams additinla params to log
 */
export function logError(message: any, ...optionalParams: any[]): void {
  const logMessage = `👻[Error] ${message}`;
  console.error(logMessage, optionalParams);
}
