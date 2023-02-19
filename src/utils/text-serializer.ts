import { Node as ProseNode, Mark, Slice, Schema, NodeType, MarkType, Fragment } from "prosemirror-model";
import { createMathSchema } from "src/math-schema";
import { SchemaMarkT, SchemaNodeT } from "./types";

////////////////////////////////////////////////////////////////////////////////

type TypedNode<T extends string> = ProseNode & { type: NodeType & { name: T } };
type TypedMark<T extends string> = Mark      & { type: MarkType & { name: T } };

type NodeSerializer<T extends string, S extends Schema<T,any>> = (node: TypedNode<T>) => string;
type MarkSerializer<T extends string, S extends Schema<T,any>> = (mark: TypedMark<T>) => string;

class ProseMirrorTextSerializer<S extends Schema<any, any>> {

	public nodes: { [name: string] : NodeSerializer<string, S>|undefined };
	public marks: { [name: string] : NodeSerializer<string, S>|undefined };

	constructor(fns: {
			nodes?: { [name in SchemaNodeT<S>]? : NodeSerializer<name, S> },
			marks?: { [name in SchemaMarkT<S>]? : MarkSerializer<name, S> },
		}, base?: ProseMirrorTextSerializer<S>
	) {
		// use base serializer as a fallback
		this.nodes = { ...base?.nodes, ...fns.nodes };
		this.marks = { ...base?.marks, ...fns.marks };
	}

	serializeFragment(fragment: Fragment): string {
		// adapted from the undocumented `Fragment.textBetween` function
		// https://github.com/ProseMirror/prosemirror-model/blob/eef20c8c6dbf841b1d70859df5d59c21b5108a4f/src/fragment.js#L46
		let blockSeparator = "\n\n";
		let leafText:string|undefined = undefined;
		let text: string = "";
		let separated: boolean = true;

		let from = 0;
		let to = fragment.size;

		fragment.nodesBetween(from, to, (node, pos) => {
			// check if one of our custom serializers handles this node
			let serialized: string|null = this.serializeNode(node);
			if(serialized !== null) {
				text += serialized;
				return false;
			}

			if (node.isText) {
				text += node.text?.slice(Math.max(from, pos) - pos, to - pos) || "";
				separated = !blockSeparator
			} else if (node.isLeaf && leafText) {
				text += leafText
				separated = !blockSeparator
			} else if (!separated && node.isBlock) {
				text += blockSeparator
				separated = true
			}
		}, 0);

		return text;
	}

	serializeSlice(slice: Slice): string {
		return this.serializeFragment(slice.content);
	}

	serializeNode(node: ProseNode): string|null {
		// check if one of our custom serializers handles this node
		let nodeSerializer = this.nodes[node.type.name];
		if(nodeSerializer !== undefined) {
			return nodeSerializer(node);
		} else {
			return null;
		}
	}

}

export const mathSerializer = new ProseMirrorTextSerializer<ReturnType<typeof createMathSchema>>({
	nodes : {
		"math_inline"  : (node) => `$${node.textContent}$`,
		"math_display" : (node) => `\n\n$$\n${node.textContent}\n$$`
	}
});