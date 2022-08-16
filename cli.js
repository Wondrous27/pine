#!/usr/bin/env node

import meow from "meow";
import { pine } from "./lib/index.js";
const cli = meow(
	`
    USAGE:  
      $ dust [OPTIONS] [inputs]

    ARGS: 
      <inputs> [default: .]

    OPTIONS:
      --depth, -d  Number of depths to traverse [default: Infinity]
      --help,  -h  Display help screen
      --size,  -s  Display total file sizes
`,
	{
		importMeta: import.meta,
		flags: {
			depth: {
				type: "number",
				alias: "d",
			},
      size: {
        type: "boolean",
        alias: "s"
      }
		},
	}
);

// path | depth: {}
pine(cli.input[0], cli.flags);
