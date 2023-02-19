import { Schema, SchemaSpec } from "prosemirror-model";
import type { ParseError } from "katex";

////////////////////////////////////////////////////////////////////////////////

// infer generic `Nodes` and `Marks` type parameters for a SchemaSpec
export type SchemaSpecNodeT<Spec> = Spec extends SchemaSpec<infer N, infer _> ? N : never;
export type SchemaSpecMarkT<Spec> = Spec extends SchemaSpec<infer _, infer M> ? M : never;

export type SchemaNodeT<S> = S extends Schema<infer N, infer _> ? N : never;
export type SchemaMarkT<S> = S extends Schema<infer _, infer M> ? M : never;

export function isParseError(s: unknown): s is ParseError {
	if (typeof s !== "object") return false;
	let o = s as Record<keyof any, any>;
    if (typeof o["name"] !== "string") return false;
	if (typeof o["message"] !== "string") return false;
	if (typeof o["position"] !== "string") return false;

	return true;
}