# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Cocos Creator 3.8.8** project for 2D game development using TypeScript.

## Project Structure

### Directory Layout

| Directory | Purpose |
|-----------|---------|
| `assets/` | Source assets (scripts, scenes, images, audio). Empty initially. |
| `library/` | Generated asset database (cached imports, UUID mappings). |
| `temp/` | Temporary files including TypeScript declarations. |
| `settings/` | Editor settings and module configurations. |
| `profiles/` | Editor profile data. |
| `build/` | Build output directory (gitignored). |

### Key Files

- `package.json` - Project metadata with Cocos Creator version
- `tsconfig.json` - Extends `./temp/tsconfig.cocos.json`, disables strict mode
- `settings/v2/packages/engine.json` - Engine module configuration

## Architecture

### Engine Modules Enabled

The project is configured for 2D game development with these modules:

- **Core**: base, gfx-webgl, gfx-webgl2, animation
- **2D**: 2d, ui, mask, graphics, rich-text, intersection-2d, sorting-2d
- **Animation**: spine-3.8, dragon-bones, tween
- **Media**: audio, video, webview
- **Maps**: tiled-map
- **Particles**: particle-2d
- **Physics**: physics-2d (using box2d)

Disabled modules: 3D, physics-ammo, terrain, XR, WebGPU

### TypeScript Configuration

- **Target**: ES2015
- **Module**: ES2015
- **Decorators**: Experimental decorators enabled (required for Cocos component decorators like `@ccclass`, `@property`)
- **Paths**:
  - `db://internal/*` → Cocos engine built-in assets
  - `db://assets/*` → Project assets folder

### Asset System

- All assets use **UUID** references (stored in `.meta` files)
- Images default to **sprite-frame** type
- The `library/` folder caches imported assets and should not be manually edited

## Common Commands

### Cocos Creator CLI

```bash
# Open project in Cocos Creator Dashboard
cocos-editor . --proj

# Open project directly
cocos-editor .
```

### Development Workflow

1. **Run the game**: Use Cocos Creator Editor → Preview button (or Ctrl/Cmd + P)
2. **Build**: Use Editor → Project → Build (not available via CLI for this version)

### TypeScript

Type checking is done through the Editor or your IDE. The project uses:
- Declaration files in `temp/declarations/` for Cocos engine types
- Custom macros in `temp/declarations/cc.custom-macro.d.ts`

## Code Patterns

### Component Example

```typescript
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MyComponent')
export class MyComponent extends Component {
    @property(Node)
    targetNode: Node | null = null;

    start() {
        // Initialization
    }

    update(deltaTime: number) {
        // Per-frame update
    }
}
```

### Asset Loading

```typescript
import { resources, SpriteFrame } from 'cc';

// Load sprite frame
resources.load("path/to/sprite/spriteFrame", SpriteFrame, (err, spriteFrame) => {
    if (err) {
        console.error(err);
        return;
    }
    this.sprite.spriteFrame = spriteFrame;
});
```

## Important Notes

- **Do not edit `library/` or `temp/`** - These are auto-generated
- **Scene files** (`.scene`) are JSON-based and should be edited through the Editor
- **Prefabs** use `.prefab` extension with UUID references
- The project is configured with `strict: false` in tsconfig.json
