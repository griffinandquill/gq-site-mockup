/* Quillhaven hero scene, site/quillhaven-hero at 14c6dd6. Loads img/quillhaven/hero/ hero-*.png, hero-*.json, and manifest.json. Reduced motion draws hero-still.png. A manifest source of "missing" keeps the greybox. With motion, the first pass assembles the plaza before the walk loop. */
var QuillhavenHero = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // ../../../tmp/hero-port/entry.ts
  var entry_exports = {};
  __export(entry_exports, {
    startScene: () => startScene
  });

  // ../../../tmp/hero-port/shared/ground.mjs
  var STAGE_W = 384;
  var STAGE_H = 216;
  var TILE = 16;
  var SKY = 8;
  function parseRows(rows) {
    return rows.map((row) => row.split(""));
  }
  function cellAt(grid, x, y) {
    if (y < 0 || x < 0 || y >= grid.length || x >= grid[0].length) return "g";
    return grid[y][x];
  }
  function cobbleFamily(kind) {
    return kind === "c" || kind === "d" || kind === "r";
  }
  function isWalkable(kind) {
    return cobbleFamily(kind) || kind === "p";
  }
  function tileName(grid, x, y) {
    const kind = cellAt(grid, x, y);
    if (kind === "g") return "grass";
    if (kind === "d") return "cobble_alt";
    if (kind === "r") return "road";
    const family = kind === "p" ? "path" : "cobble";
    const matches = (nx, ny) => {
      const other = cellAt(grid, nx, ny);
      return family === "path" ? other === "p" : cobbleFamily(other);
    };
    const north = matches(x, y - 1);
    const south = matches(x, y + 1);
    const west = matches(x - 1, y);
    const east = matches(x + 1, y);
    if (!north && !west) return `${family}_nw`;
    if (!north && !east) return `${family}_ne`;
    if (!south && !west) return `${family}_sw`;
    if (!south && !east) return `${family}_se`;
    if (!north) return `${family}_n`;
    if (!south) return `${family}_s`;
    if (!west) return `${family}_w`;
    if (!east) return `${family}_e`;
    return family;
  }
  function feetOf(cellX, cellY) {
    return {
      x: cellX * TILE + TILE / 2,
      y: SKY + cellY * TILE + TILE / 2
    };
  }

  // ../../../tmp/hero-port/shared/motion.mjs
  function flyerOffset(kind, time, phase, span, speed) {
    if (kind === "bird") {
      const travel = span <= 0 ? 0 : time * speed % span;
      return {
        x: Math.round(travel),
        y: Math.round(Math.sin(time * 1.4 + phase) * 3),
        frame: Math.floor(time * 6 + phase) % 2
      };
    }
    if (kind === "butterfly") {
      return {
        x: Math.round(Math.sin(time * speed * 0.15 + phase) * span),
        y: Math.round(Math.cos(time * speed * 0.22 + phase) * span * 0.45),
        frame: Math.floor(time * 8 + phase) % 2
      };
    }
    const neverKind = kind;
    throw new Error(String(neverKind));
  }
  function swayPixels(time, seed) {
    return Math.round(Math.sin(time * 1.7 + seed));
  }

  // ../../../tmp/hero-port/src/plaza.json
  var plaza_default = {
    cols: 24,
    rows: 13,
    chatSeed: 7,
    academyY: 12,
    rowsText: [
      "gggggggggggggggggggggggg",
      "gggggggggggggggggggggggg",
      "gggggggggggggggggggggggg",
      "gggggggggggggggggggggggg",
      "gggggggggggggggggggggggg",
      "gggggggggggggggggggggggg",
      "gggcdccdccrrccdccdcggggg",
      "gggccccdccrrcccdcccggggg",
      "gggcdcccdccrrdcccccggggg",
      "gggcdccdccrrccdccdcggggg",
      "gggcccccccrrcccccccggggg",
      "ggggggggggppppgggggggggg",
      "ggggggggggppppgggggggggg"
    ],
    blocks: [
      [4, 8],
      [5, 8],
      [4, 9],
      [5, 9],
      [15, 8],
      [16, 8],
      [15, 9],
      [16, 9],
      [12, 8],
      [13, 8],
      [12, 9],
      [13, 9],
      [6, 7],
      [7, 7],
      [17, 10],
      [18, 10],
      [5, 6],
      [17, 6],
      [9, 6],
      [14, 6]
    ],
    props: [
      { frame: "tree_pine_large", x: 248, y: 46, sway: true },
      { frame: "tree_round_a", x: 96, y: 52, sway: true },
      { frame: "house_red_a", x: 0, y: 40 },
      { frame: "tree_round_b", x: 348, y: 64, sway: true },
      { frame: "house_red_b", x: 20, y: 88 },
      { frame: "house_red_c", x: 292, y: 104 },
      { frame: "academy", x: 128, y: 108 },
      { frame: "street_lamp_blue", x: 80, y: 120, flame: true },
      { frame: "street_lamp_blue", x: 272, y: 120, flame: true },
      { frame: "torch", x: 144, y: 120, flicker: true },
      { frame: "torch", x: 224, y: 120, flicker: true },
      { frame: "bench_wood_a", x: 96, y: 136 },
      { frame: "pond_n", x: 192, y: 152 },
      { frame: "pond_n", x: 208, y: 152 },
      { frame: "stall_bakery", x: 64, y: 168 },
      { frame: "stall_flower", x: 240, y: 168 },
      { frame: "pond_s", x: 192, y: 168 },
      { frame: "pond_s", x: 208, y: 168 },
      { frame: "bench_wood_b", x: 272, y: 184 }
    ],
    flyers: [
      { kind: "bird", x: 18, y: 16, span: 168, speed: 26, phase: 0 },
      { kind: "bird", x: 210, y: 10, span: 140, speed: 20, phase: 2.1 },
      { kind: "butterfly", x: 78, y: 146, span: 14, speed: 16, phase: 0.4 },
      { kind: "butterfly", x: 252, y: 150, span: 16, speed: 14, phase: 1.3 }
    ],
    actors: [
      {
        id: "tahne",
        name: "Tahne",
        role: "leash",
        leash: 1,
        home: [12, 6],
        idle: 0.8,
        facing: "down",
        line: "I am Tahne."
      },
      {
        id: "winston",
        name: "Winston Wolf",
        role: "leash",
        leash: 1,
        home: [11, 12],
        idle: 1.2,
        facing: "up",
        line: "Winston Wolf, at your service. I lead the cave expeditions."
      },
      {
        id: "pip",
        name: "Pip Marlow",
        role: "wander",
        leash: 5,
        home: [8, 8],
        idle: 4,
        facing: "down",
        line: "Pip Marlow! Books, bottles, flowers. A little bit of everything!"
      },
      {
        id: "wren",
        name: "Wren Applegate",
        role: "wander",
        leash: 5,
        home: [10, 8],
        idle: 4,
        facing: "down",
        line: "Wren Applegate. This is my house. Nice day for a walk."
      },
      {
        id: "elowen",
        name: "Elowen",
        role: "wander",
        leash: 3,
        home: [18, 9],
        idle: 0.25,
        facing: "down",
        line: "I am Elowen. I keep the ink bench beside yours at the Academy."
      },
      {
        id: "bramble",
        name: "Professor Bramble",
        role: "leash",
        leash: 2,
        home: [17, 7],
        idle: 1.1,
        facing: "down",
        line: "Professor Bramble. I keep the Academy library."
      }
    ]
  };

  // ../../../tmp/hero-port/src/types.ts
  var DIRS = ["down", "left", "right", "up"];

  // ../../../tmp/hero-port/src/sim.ts
  var WALK_SPEED = 28;
  var CHAT_TIME = 3;
  var CHAT_RANGE = 40;
  var CHAT_CHECK = 0.5;
  var ACTOR_CAP = 6;
  var EMOTES = ["talk", "laugh", "question", "yes"];
  var STEPS = {
    right: { x: 1, y: 0 },
    left: { x: -1, y: 0 },
    down: { x: 0, y: 1 },
    up: { x: 0, y: -1 }
  };
  function mulberry32(seed) {
    let state = seed >>> 0;
    return () => {
      state |= 0;
      state = state + 1831565813 | 0;
      let t = Math.imul(state ^ state >>> 15, 1 | state);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hashSeed(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
  function keyOf(cell) {
    return `${cell.x},${cell.y}`;
  }
  function cellOf(actor) {
    return {
      x: Math.floor(actor.x / TILE),
      y: Math.floor((actor.y - (feetOf(0, 0).y - TILE / 2)) / TILE)
    };
  }
  function canStand(world, cell, self) {
    if (!isWalkable(cellAt(world.grid, cell.x, cell.y))) return false;
    if (world.blocked.has(`${cell.x},${cell.y}`)) return false;
    for (const other of world.actors) {
      if (other === self) continue;
      const at = cellOf(other);
      if (at.x === cell.x && at.y === cell.y) return false;
      const next = other.path[0];
      if (next && next.x === cell.x && next.y === cell.y) return false;
    }
    return true;
  }
  function reachOf(role, leash) {
    switch (role) {
      case "leash":
        return 1;
      case "wander":
        return leash;
      default: {
        const neverRole = role;
        return neverRole;
      }
    }
  }
  function reachable(world, self, start, radius) {
    const home = { x: self.homeX, y: self.homeY };
    const seen = /* @__PURE__ */ new Set([keyOf(start)]);
    const queue = [start];
    const out = [];
    while (queue.length > 0 && out.length < 40) {
      const at = queue.shift();
      if (!at) break;
      out.push(at);
      for (const dir of DIRS) {
        const step = STEPS[dir];
        const next = { x: at.x + step.x, y: at.y + step.y };
        const id = keyOf(next);
        if (seen.has(id)) continue;
        if (Math.max(Math.abs(next.x - home.x), Math.abs(next.y - home.y)) > radius) continue;
        seen.add(id);
        if (!canStand(world, next, self)) continue;
        queue.push(next);
      }
    }
    return out;
  }
  function findPath(world, self, goal, radius) {
    const start = cellOf(self);
    const home = { x: self.homeX, y: self.homeY };
    const came = /* @__PURE__ */ new Map([[keyOf(start), keyOf(start)]]);
    const queue = [start];
    let budget = 4e3;
    while (queue.length > 0 && budget > 0) {
      budget -= 1;
      const at = queue.shift();
      if (!at) break;
      if (at.x === goal.x && at.y === goal.y) {
        const out = [];
        let cursor = at;
        while (cursor.x !== start.x || cursor.y !== start.y) {
          out.unshift(cursor);
          const prev = came.get(keyOf(cursor));
          if (!prev) break;
          const [x, y] = prev.split(",");
          cursor = { x: Number(x), y: Number(y) };
        }
        return out;
      }
      for (const dir of DIRS) {
        const step = STEPS[dir];
        const next = { x: at.x + step.x, y: at.y + step.y };
        const id = keyOf(next);
        if (came.has(id)) continue;
        if (Math.max(Math.abs(next.x - home.x), Math.abs(next.y - home.y)) > radius) continue;
        const isGoal = next.x === goal.x && next.y === goal.y;
        if (!isGoal && !canStand(world, next, self)) continue;
        came.set(id, keyOf(at));
        queue.push(next);
      }
    }
    return [];
  }
  function setFacing(actor, stepX, stepY) {
    if (stepX === 0 && stepY === 0) return;
    if (Math.abs(stepX) > Math.abs(stepY)) {
      actor.facing = stepX > 0 ? "right" : "left";
      return;
    }
    actor.facing = stepY > 0 ? "down" : "up";
  }
  function faceToward(actor, other) {
    setFacing(actor, other.x - actor.x, other.y - actor.y);
  }
  function arrive(actor) {
    actor.mode = "idle";
    actor.path = [];
    switch (actor.role) {
      case "leash":
        actor.idleLeft = 5 + actor.rng() * 5;
        break;
      case "wander":
        actor.idleLeft = 2 + actor.rng() * 4;
        break;
      default: {
        const neverRole = actor.role;
        throw new Error(String(neverRole));
      }
    }
  }
  function pickWalk(world, actor) {
    var _a;
    const radius = reachOf(actor.role, actor.leash);
    const here = cellOf(actor);
    const options = reachable(world, actor, here, radius).filter((cell) => cell.x !== here.x || cell.y !== here.y);
    if (options.length === 0) {
      actor.idleLeft = 1 + actor.rng() * 2;
      return;
    }
    const goal = (_a = options[Math.floor(actor.rng() * options.length)]) != null ? _a : options[0];
    const steps = findPath(world, actor, goal, radius);
    if (steps.length === 0) {
      actor.idleLeft = 1 + actor.rng() * 2;
      return;
    }
    actor.path = steps;
    actor.mode = "walk";
  }
  function follow(world, actor, dt) {
    const next = actor.path[0];
    if (!next) {
      arrive(actor);
      return;
    }
    const here = cellOf(actor);
    if ((next.x !== here.x || next.y !== here.y) && !canStand(world, next, actor)) {
      actor.blocked += dt;
      if (actor.blocked > 0.8) {
        actor.blocked = 0;
        actor.path = [];
        arrive(actor);
      }
      return;
    }
    actor.blocked = 0;
    const target = feetOf(next.x, next.y);
    const stepX = target.x - actor.x;
    const stepY = target.y - actor.y;
    const length = Math.hypot(stepX, stepY);
    setFacing(actor, stepX, stepY);
    if (length <= WALK_SPEED * dt) {
      actor.x = target.x;
      actor.y = target.y;
      actor.path.shift();
      if (actor.path.length === 0) arrive(actor);
      return;
    }
    actor.x += stepX / length * WALK_SPEED * dt;
    actor.y += stepY / length * WALK_SPEED * dt;
  }
  function canChat(actor) {
    return actor.role === "wander" && actor.mode === "idle" && actor.chatCooldown <= 0;
  }
  function emoteFor(a, b) {
    var _a;
    const key = [a, b].sort().join(":");
    let hash = 0;
    for (const char of key) hash = hash * 33 + char.charCodeAt(0) >>> 0;
    return (_a = EMOTES[hash % EMOTES.length]) != null ? _a : "talk";
  }
  function startChat(actor, other, emote) {
    actor.mode = "chat";
    actor.path = [];
    actor.chatWith = other.id;
    actor.chatLeft = CHAT_TIME;
    actor.chatElapsed = 0;
    actor.chatCooldown = 12 + actor.rng() * 8;
    actor.emote = emote;
    faceToward(actor, other);
  }
  function endChat(actor) {
    if (actor.mode === "chat") {
      actor.mode = "idle";
      actor.idleLeft = actor.role === "leash" ? 5 + actor.rng() * 5 : 1.5 + actor.rng() * 2.5;
    }
    actor.chatWith = null;
    actor.emote = null;
  }
  function pair(world) {
    for (const actor of world.actors) {
      if (!canChat(actor)) continue;
      for (const other of world.actors) {
        if (other === actor || !canChat(other)) continue;
        const distance = Math.hypot(actor.x - other.x, actor.y - other.y);
        if (distance <= CHAT_RANGE && world.rng() < 0.35) {
          const emote = emoteFor(actor.id, other.id);
          startChat(actor, other, emote);
          startChat(other, actor, emote);
          break;
        }
      }
    }
  }
  function tickActor(world, actor, dt) {
    actor.animTime += dt;
    actor.chatCooldown = Math.max(0, actor.chatCooldown - dt);
    switch (actor.mode) {
      case "walk":
        follow(world, actor, dt);
        break;
      case "chat":
        actor.chatElapsed += dt;
        actor.chatLeft -= dt;
        if (actor.chatLeft <= 0) {
          world.lastChatSeconds = actor.chatElapsed;
          endChat(actor);
        }
        break;
      case "idle":
        actor.idleLeft -= dt;
        if (actor.idleLeft <= 0) pickWalk(world, actor);
        break;
      default: {
        const neverMode = actor.mode;
        throw new Error(String(neverMode));
      }
    }
  }
  function tick(world, dt) {
    world.time += dt;
    for (const actor of world.actors) tickActor(world, actor, dt);
    world.chatClock += dt;
    if (world.chatClock < CHAT_CHECK) return;
    world.chatClock = 0;
    pair(world);
  }
  function makeWorld(plaza, grid) {
    const actors = plaza.actors.slice(0, ACTOR_CAP).map((spec) => {
      const feet = feetOf(spec.home[0], spec.home[1]);
      const actor = {
        id: spec.id,
        name: spec.name,
        line: spec.line,
        role: spec.role,
        leash: spec.leash,
        homeX: spec.home[0],
        homeY: spec.home[1],
        x: feet.x,
        y: feet.y,
        mode: "idle",
        facing: spec.facing,
        path: [],
        idleLeft: spec.idle,
        chatLeft: 0,
        chatElapsed: 0,
        chatCooldown: 0,
        chatWith: null,
        emote: null,
        animTime: 0,
        blocked: 0,
        rng: mulberry32(hashSeed(spec.id))
      };
      return actor;
    });
    const blocked = new Set(plaza.blocks.map(([x, y]) => `${x},${y}`));
    return {
      actors,
      grid,
      blocked,
      chatClock: 0,
      time: 0,
      rng: mulberry32(plaza.chatSeed),
      lastChatSeconds: 0
    };
  }

  // ../../../tmp/hero-port/src/scene.ts
  function asPlaza(data) {
    return {
      cols: data.cols,
      rows: data.rows,
      chatSeed: data.chatSeed,
      academyY: data.academyY,
      rowsText: data.rowsText,
      blocks: data.blocks.map((cell) => {
        var _a, _b;
        return [(_a = cell[0]) != null ? _a : 0, (_b = cell[1]) != null ? _b : 0];
      }),
      props: data.props.map((prop) => ({
        frame: prop.frame,
        x: prop.x,
        y: prop.y,
        sway: prop.sway === true,
        flicker: prop.flicker === true,
        flame: prop.flame === true
      })),
      flyers: data.flyers.map((flyer) => ({
        kind: asFlyer(flyer.kind),
        x: flyer.x,
        y: flyer.y,
        span: flyer.span,
        speed: flyer.speed,
        phase: flyer.phase
      })),
      actors: data.actors.map((actor) => {
        var _a, _b;
        return {
          id: actor.id,
          name: actor.name,
          role: actor.role === "leash" ? "leash" : "wander",
          leash: actor.leash,
          home: [(_a = actor.home[0]) != null ? _a : 0, (_b = actor.home[1]) != null ? _b : 0],
          idle: actor.idle,
          facing: asDir(actor.facing),
          line: actor.line
        };
      })
    };
  }
  function asFlyer(value) {
    switch (value) {
      case "bird":
      case "butterfly":
        return value;
      default:
        return "bird";
    }
  }
  function asDir(value) {
    switch (value) {
      case "down":
      case "left":
      case "right":
      case "up":
        return value;
      default:
        return "down";
    }
  }
  function atlasFileName(name) {
    if (!/^hero-[a-z0-9-]+\.png$/.test(name) && !/^hero-[a-z0-9-]+\.json$/.test(name) && name !== "manifest.json") {
      throw new Error("atlas image failed");
    }
    return name;
  }
  async function loadImage(src) {
    const image = new Image();
    const ready = new Promise((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("atlas image failed"));
    });
    image.src = src;
    await ready;
    return image;
  }
  async function loadJson(src) {
    const response = await fetch(src);
    if (!response.ok) throw new Error("atlas json failed");
    return await response.json();
  }
  async function loadAtlases(base) {
    const root = base.endsWith("/") ? base : `${base}/`;
    const manifest = await loadJson(`${root}${atlasFileName("manifest.json")}`);
    if (!manifest || typeof manifest.source !== "string" || typeof manifest.note !== "string") {
      throw new Error("atlas json failed");
    }
    if (manifest.source === "missing") throw new Error("atlas json failed");
    const [ground, academy, actors, emotes, props] = await Promise.all([
      loadJson(`${root}${atlasFileName("hero-ground.json")}`),
      loadJson(`${root}${atlasFileName("hero-academy.json")}`),
      loadJson(`${root}${atlasFileName("hero-actors.json")}`),
      loadJson(`${root}${atlasFileName("hero-emotes.json")}`),
      loadJson(`${root}${atlasFileName("hero-props.json")}`)
    ]);
    const [groundImage, academyImage, actorImage, emoteImage, propsImage, stillImage] = await Promise.all([
      loadImage(`${root}${atlasFileName(ground.image)}`),
      loadImage(`${root}${atlasFileName(academy.image)}`),
      loadImage(`${root}${atlasFileName(actors.image)}`),
      loadImage(`${root}${atlasFileName(emotes.image)}`),
      loadImage(`${root}${atlasFileName(props.image)}`),
      loadImage(`${root}${atlasFileName("hero-still.png")}`)
    ]);
    return {
      ground,
      groundImage,
      academy,
      academyImage,
      actors,
      actorImage,
      emotes,
      emoteImage,
      props,
      propsImage,
      manifest,
      stillImage
    };
  }
  function blit(ctx, image, frame, dx, dy) {
    ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, dx | 0, dy | 0, frame.w, frame.h);
  }
  function actorRect(file, actor, reduced) {
    var _a;
    const origin = (_a = file.actors[actor.id]) != null ? _a : { x: 0, y: 0 };
    const [fw, fh] = file.frame;
    const dirIndex = Math.max(0, file.directions.indexOf(actor.facing));
    const count = Math.max(1, file.frames);
    let index = Math.min(1, count - 1);
    if (!reduced) {
      const fps = actor.mode === "walk" ? 10 : 8;
      index = Math.floor(actor.animTime * fps) % count;
    }
    return { x: origin.x + index * fw, y: origin.y + dirIndex * fh, w: fw, h: fh };
  }
  function emoteFrameList(file, id) {
    var _a;
    switch (id) {
      case "talk":
      case "laugh":
      case "question":
      case "yes":
        return (_a = file.emotes[id]) != null ? _a : [];
      default: {
        const neverId = id;
        return neverId;
      }
    }
  }
  var FLAME = ["#ffe7a8", "#ffb04a", "#ff7a32"];
  function softShadow(ctx, x, y, width) {
    const rx = Math.max(4, Math.round(width * 0.28));
    const ry = Math.max(2, Math.round(rx * 0.35));
    ctx.fillStyle = "rgba(36,24,15,0.16)";
    ctx.beginPath();
    ctx.ellipse(x, y, rx + 2, ry + 1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(36,24,15,0.28)";
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function propFrame(atlases, prop, time) {
    if (prop.frame === "academy") return atlases.academy.frame;
    if (prop.flicker) {
      const index = Math.floor(time * 8) % 4;
      return atlases.props.frames[`torch_${index}`];
    }
    return atlases.props.frames[prop.frame];
  }
  function paintProp(ctx, atlases, prop, time) {
    var _a;
    const frame = propFrame(atlases, prop, time);
    if (!frame) return;
    const dx = prop.sway ? swayPixels(time, prop.x * 0.05) : 0;
    const left = prop.x + dx;
    const image = prop.frame === "academy" ? atlases.academyImage : atlases.propsImage;
    softShadow(ctx, left + Math.round(frame.w / 2), prop.y - 1, frame.w);
    blit(ctx, image, frame, left, prop.y - frame.h);
    if (!prop.flame) return;
    const hot = Math.floor(time * 9) % FLAME.length;
    ctx.fillStyle = (_a = FLAME[hot]) != null ? _a : FLAME[0];
    ctx.fillRect(left + 7, prop.y - 29, 2, hot === 2 ? 2 : 3);
  }
  function paintFlyer(ctx, atlases, flyer, time) {
    const offset = flyerOffset(flyer.kind, time, flyer.phase, flyer.span, flyer.speed);
    const frame = atlases.props.frames[`${flyer.kind}_${offset.frame}`];
    if (!frame) return;
    blit(ctx, atlases.propsImage, frame, flyer.x + offset.x, flyer.y + offset.y);
  }
  function draw(ctx, atlases, world, plaza, reduced) {
    var _a, _b, _c, _d;
    const grid = world.grid;
    const time = reduced ? 0 : world.time;
    ctx.fillStyle = "#8fb8d8";
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    for (let y = 0; y < grid.length; y += 1) {
      const row = grid[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x += 1) {
        const name = tileName(grid, x, y);
        const frame = (_a = atlases.ground.frames[name]) != null ? _a : atlases.ground.frames.grass;
        if (!frame) continue;
        blit(ctx, atlases.groundImage, frame, x * TILE, SKY + y * TILE);
      }
    }
    const items = [];
    for (const prop of plaza.props) {
      items.push({ y: prop.y, z: 0, paint: () => paintProp(ctx, atlases, prop, time) });
    }
    for (const actor of world.actors) {
      items.push({
        y: actor.y,
        z: 1,
        paint: () => {
          const frame = actorRect(atlases.actors, actor, reduced);
          softShadow(ctx, Math.round(actor.x), Math.round(actor.y) - 1, frame.w);
          blit(ctx, atlases.actorImage, frame, Math.round(actor.x - frame.w / 2), Math.round(actor.y - frame.h));
        }
      });
    }
    for (const flyer of plaza.flyers) {
      const offset = flyerOffset(flyer.kind, time, flyer.phase, flyer.span, flyer.speed);
      items.push({
        y: flyer.y + offset.y + 8,
        z: 0,
        paint: () => paintFlyer(ctx, atlases, flyer, time)
      });
    }
    items.sort((a, b) => a.y - b.y || a.z - b.z);
    for (const item of items) item.paint();
    const ordered = [...world.actors].sort((a, b) => a.y - b.y);
    let sawBubble = false;
    for (const actor of ordered) {
      if (actor.mode !== "chat" || !actor.emote) continue;
      const bubble = (_c = (_b = atlases.emotes.bubbles["3"]) != null ? _b : atlases.emotes.bubbles["2"]) != null ? _c : atlases.emotes.bubbles["1"];
      const frames = emoteFrameList(atlases.emotes, actor.emote);
      if (!bubble || frames.length === 0) continue;
      const emote = (_d = frames[Math.floor(actor.animTime * 6) % frames.length]) != null ? _d : frames[0];
      if (!emote) continue;
      const bx = Math.round(actor.x - bubble.w / 2);
      const by = Math.round(actor.y - 34 - bubble.h);
      blit(ctx, atlases.emoteImage, bubble, bx, by);
      blit(
        ctx,
        atlases.emoteImage,
        emote,
        bx + Math.round((bubble.w - emote.w) / 2),
        by + Math.round((bubble.h - emote.h) / 2) - 2
      );
      sawBubble = true;
    }
    return sawBubble;
  }
  var INTRO_SCAN = 1.2;
  var INTRO_GROUND = 2.2;
  var INTRO_BUILDINGS = 2;
  var INTRO_PROPS = 2.15;
  var INTRO_FOLK = 2.55;
  var INTRO_UI = 0.85;
  function isBuildingFrame(frame) {
    return frame === "academy" || frame === "house_red_a" || frame === "house_red_b" || frame === "house_red_c";
  }
  function clamp01(value) {
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }
  function shownCount(t, start, dur, count, rushEnd) {
    if (count <= 0 || t <= start) return 0;
    if (t >= start + dur) return count;
    const u = (t - start) / dur;
    const shaped = rushEnd ? Math.pow(u, 1.7) : u;
    return Math.min(count, Math.ceil(shaped * count));
  }
  function dropPixels(t, start, dur, index, count) {
    if (count <= 0) return 0;
    const slot = dur / count;
    const age = t - (start + index * slot);
    const span = Math.min(0.22, slot);
    if (age >= span) return 0;
    if (age <= 0) return 6;
    const u = age / span;
    const eased = u * u * (3 - 2 * u);
    return Math.round((1 - eased) * 6);
  }
  function folkPose(actor, index, phaseT) {
    const begin = index * 0.15;
    const dur = 1.55;
    if (phaseT < begin) return null;
    const u = clamp01((phaseT - begin) / dur);
    const eased = u * u * (3 - 2 * u);
    const fromX = index % 2 === 0 ? -32 : STAGE_W + 32;
    const arrived = u >= 1;
    return {
      x: arrived ? actor.x : Math.round(fromX + (actor.x - fromX) * eased),
      y: actor.y,
      facing: arrived ? actor.facing : fromX < actor.x ? "right" : "left",
      mode: arrived ? "idle" : "walk",
      animTime: arrived ? 0 : phaseT,
      arrived
    };
  }
  function drawPosedActor(ctx, atlases, actor, pose) {
    const prevX = actor.x;
    const prevY = actor.y;
    const prevFacing = actor.facing;
    const prevMode = actor.mode;
    const prevAnim = actor.animTime;
    actor.x = pose.x;
    actor.y = pose.y;
    actor.facing = pose.facing;
    actor.mode = pose.mode;
    actor.animTime = pose.animTime;
    try {
      const frame = actorRect(atlases.actors, actor, false);
      softShadow(ctx, Math.round(actor.x), Math.round(actor.y) - 1, frame.w);
      blit(ctx, atlases.actorImage, frame, Math.round(actor.x - frame.w / 2), Math.round(actor.y - frame.h));
    } finally {
      actor.x = prevX;
      actor.y = prevY;
      actor.facing = prevFacing;
      actor.mode = prevMode;
      actor.animTime = prevAnim;
    }
  }
  function createAssemble(atlases, world, plaza) {
    const grid = world.grid;
    const buildings = plaza.props.filter((prop) => isBuildingFrame(prop.frame)).sort((a, b) => a.y - b.y);
    const propPieces = [];
    for (const prop of plaza.props) {
      if (!isBuildingFrame(prop.frame)) propPieces.push({ kind: "prop", prop, y: prop.y });
    }
    for (const flyer of plaza.flyers) propPieces.push({ kind: "flyer", flyer, y: flyer.y });
    propPieces.sort((a, b) => b.y - a.y);
    const tileOrder = [];
    for (let y = grid.length - 1; y >= 0; y -= 1) {
      const row = grid[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x += 1) tileOrder.push({ x, y });
    }
    const total = tileOrder.length + buildings.length + propPieces.length + world.actors.length + 1;
    const groundAt = INTRO_SCAN;
    const buildAt = groundAt + INTRO_GROUND;
    const propsAt = buildAt + INTRO_BUILDINGS;
    const folkAt = propsAt + INTRO_PROPS;
    const uiAt = folkAt + INTRO_FOLK;
    const totalTime = uiAt + INTRO_UI;
    const hud = {
      phase: "scan",
      placed: 0,
      total,
      box: null,
      scan: -1,
      ui: false,
      done: false,
      mark: ""
    };
    const boxRect = { x: 0, y: 0, w: 0, h: 0 };
    function setBox(x, y, w, h, mark) {
      boxRect.x = x - 2;
      boxRect.y = y - 2;
      boxRect.w = w + 4;
      boxRect.h = h + 4;
      hud.box = boxRect;
      hud.mark = mark;
    }
    function reset() {
      world.time = 0;
      world.chatClock = 0;
      world.lastChatSeconds = 0;
      world.rng = mulberry32(plaza.chatSeed);
      for (let index = 0; index < world.actors.length; index += 1) {
        const spec = plaza.actors[index];
        const actor = world.actors[index];
        if (!spec || !actor) continue;
        const feet = feetOf(spec.home[0], spec.home[1]);
        actor.x = feet.x;
        actor.y = feet.y;
        actor.mode = "idle";
        actor.facing = spec.facing;
        actor.path = [];
        actor.idleLeft = spec.idle;
        actor.chatLeft = 0;
        actor.chatElapsed = 0;
        actor.chatCooldown = 0;
        actor.chatWith = null;
        actor.emote = null;
        actor.animTime = 0;
        actor.blocked = 0;
        actor.rng = mulberry32(hashSeed(spec.id));
      }
    }
    function render(ctx, t) {
      let phase = "scan";
      if (t >= folkAt) phase = "folk";
      else if (t >= propsAt) phase = "props";
      else if (t >= buildAt) phase = "buildings";
      else if (t >= groundAt) phase = "ground";
      const tilesShown = shownCount(t, groundAt, INTRO_GROUND, tileOrder.length, true);
      const buildingsShown = shownCount(t, buildAt, INTRO_BUILDINGS, buildings.length, false);
      const propsShown = shownCount(t, propsAt, INTRO_PROPS, propPieces.length, false);
      const poses = new Array(world.actors.length);
      let folkArrived = 0;
      let activeFolk = -1;
      if (phase === "folk") {
        const phaseT = t - folkAt;
        for (let index = 0; index < world.actors.length; index += 1) {
          const pose = folkPose(world.actors[index], index, phaseT);
          poses[index] = pose;
          if (!pose) continue;
          if (pose.arrived) folkArrived += 1;
          activeFolk = index;
        }
      }
      hud.phase = phase;
      hud.placed = tilesShown + buildingsShown + propsShown + folkArrived;
      hud.total = total;
      hud.box = null;
      hud.scan = phase === "scan" ? (() => {
        const raw = clamp01(t / INTRO_SCAN);
        return raw * raw * (3 - 2 * raw);
      })() : -1;
      hud.ui = false;
      hud.done = false;
      hud.mark = phase;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#8fb8d8";
      ctx.fillRect(0, 0, STAGE_W, STAGE_H);
      for (let index = 0; index < tilesShown; index += 1) {
        const cell = tileOrder[index];
        if (!cell) continue;
        const name = tileName(grid, cell.x, cell.y);
        const frame = atlases.ground.frames[name] || atlases.ground.frames.grass;
        if (!frame) continue;
        blit(ctx, atlases.groundImage, frame, cell.x * TILE, SKY + cell.y * TILE);
      }
      const items = [];
      for (let index = 0; index < buildingsShown; index += 1) {
        const prop = buildings[index];
        const drop = dropPixels(t, buildAt, INTRO_BUILDINGS, index, buildings.length);
        items.push({
          y: prop.y,
          z: 0,
          paint: () => {
            ctx.save();
            ctx.translate(0, drop);
            paintProp(ctx, atlases, prop, 0);
            ctx.restore();
          }
        });
      }
      for (let index = 0; index < propsShown; index += 1) {
        const piece = propPieces[index];
        if (!piece) continue;
        const drop = dropPixels(t, propsAt, INTRO_PROPS, index, propPieces.length);
        if (piece.kind === "prop") {
          const prop = piece.prop;
          items.push({
            y: prop.y,
            z: 0,
            paint: () => {
              ctx.save();
              ctx.translate(0, drop);
              paintProp(ctx, atlases, prop, 0);
              ctx.restore();
            }
          });
        } else {
          const flyer = piece.flyer;
          items.push({
            y: flyer.y,
            z: 0,
            paint: () => {
              ctx.save();
              ctx.translate(0, drop);
              paintFlyer(ctx, atlases, flyer, 0);
              ctx.restore();
            }
          });
        }
      }
      for (let index = 0; index < poses.length; index += 1) {
        const pose = poses[index];
        const actor = world.actors[index];
        if (!pose || !actor) continue;
        items.push({
          y: pose.y,
          z: 1,
          paint: () => drawPosedActor(ctx, atlases, actor, pose)
        });
      }
      items.sort((a, b) => a.y - b.y || a.z - b.z);
      for (const item of items) item.paint();
      if (phase === "ground" && tilesShown > 0) {
        const latest = tileOrder[tilesShown - 1];
        if (latest) setBox(0, SKY + latest.y * TILE, (latest.x + 1) * TILE, TILE, `ground:${latest.y}`);
      } else if (phase === "buildings" && buildingsShown > 0) {
        const index = buildingsShown - 1;
        const prop = buildings[index];
        const frame = prop ? propFrame(atlases, prop, 0) : null;
        if (prop && frame) {
          const drop = dropPixels(t, buildAt, INTRO_BUILDINGS, index, buildings.length);
          setBox(prop.x, prop.y - frame.h + drop, frame.w, frame.h, `building:${index}`);
        }
      } else if (phase === "props" && propsShown > 0) {
        const index = propsShown - 1;
        const piece = propPieces[index];
        const drop = dropPixels(t, propsAt, INTRO_PROPS, index, propPieces.length);
        if (piece && piece.kind === "prop") {
          const frame = propFrame(atlases, piece.prop, 0);
          if (frame) setBox(piece.prop.x, piece.prop.y - frame.h + drop, frame.w, frame.h, `prop:${index}`);
        } else if (piece && piece.flyer) {
          const offset = flyerOffset(piece.flyer.kind, 0, piece.flyer.phase, piece.flyer.span, piece.flyer.speed);
          const frame = atlases.props.frames[`${piece.flyer.kind}_${offset.frame}`];
          if (frame) setBox(piece.flyer.x + offset.x, piece.flyer.y + offset.y + drop, frame.w, frame.h, `prop:${index}`);
        }
      } else if (phase === "folk" && activeFolk >= 0) {
        const pose = poses[activeFolk];
        const actor = world.actors[activeFolk];
        const frameSize = atlases.actors.frame;
        const fw = frameSize && frameSize[0] ? frameSize[0] : 32;
        const fh = frameSize && frameSize[1] ? frameSize[1] : 32;
        if (pose && actor) setBox(Math.round(pose.x - fw / 2), Math.round(pose.y - fh), fw, fh, `folk:${activeFolk}`);
      }
      return hud;
    }
    return { total, uiAt, totalTime, reset, render };
  }
  async function startScene(options) {
    const atlases = await loadAtlases(options.atlasBase || "img/quillhaven/hero/");
    options.canvas.width = STAGE_W;
    options.canvas.height = STAGE_H;
    const plaza = asPlaza(plaza_default);
    const grid = parseRows(plaza.rowsText);
    const world = makeWorld(plaza, grid);
    const context = options.canvas.getContext("2d");
    if (!context) throw new Error("canvas unavailable");
    const ctx = context;
    ctx.imageSmoothingEnabled = false;
    const still = () => options.isReduced();
    const assemble = createAssemble(atlases, world, plaza);
    let introOn = !still();
    let introT = 0;
    let paused = document.hidden || document.visibilityState === "hidden";
    let onScreen = true;
    let raf = 0;
    let last = performance.now();
    let frames = 0;
    let sawBubble = false;
    const chrome = {
      phase: "done",
      placed: assemble.total,
      total: assemble.total,
      box: null,
      scan: -1,
      ui: false,
      done: true,
      mark: "done"
    };
    function emit(state) {
      if (typeof options.onAssemble === "function") options.onAssemble(state);
    }
    function emitChrome(phase) {
      chrome.phase = phase;
      chrome.placed = assemble.total;
      chrome.total = assemble.total;
      chrome.box = null;
      chrome.scan = -1;
      chrome.ui = phase === "ui";
      chrome.done = phase === "done" || phase === "off";
      chrome.mark = phase;
      emit(chrome);
    }
    const frameTimes = [];
    const snapshot = () => {
      var _a;
      const chatting = world.actors.find((actor) => actor.mode === "chat");
      const modes = {};
      const positions = {};
      const animFrames = {};
      for (const actor of world.actors) {
        modes[actor.id] = actor.mode;
        positions[actor.id] = { x: actor.x, y: actor.y };
        animFrames[actor.id] = actorRect(atlases.actors, actor, still()).x;
      }
      const now = performance.now();
      const recent = frameTimes.filter((time) => time >= now - 1e3);
      return {
        started: true,
        paused: paused || still(),
        reducedMotion: still(),
        art: atlases.manifest.source,
        actorCount: world.actors.length,
        fps: recent.length,
        frames,
        smoothing: ctx.imageSmoothingEnabled,
        scale: options.getScale(),
        chatActive: Boolean(chatting),
        chatEmote: (_a = chatting == null ? void 0 : chatting.emote) != null ? _a : null,
        lastChatSeconds: world.lastChatSeconds,
        sawBubble,
        modes,
        positions,
        animFrames,
        sampleFps
      };
    };
    function sampleFps(ms = 5e3) {
      const start = performance.now();
      const startFrames = frames;
      return new Promise((resolve) => {
        const step = () => {
          const elapsed = performance.now() - start;
          if (elapsed >= ms) {
            resolve((frames - startFrames) * 1e3 / elapsed);
            return;
          }
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }
    function publish(now) {
      var _a;
      if (options.testMode) window.__gqHeroTest = snapshot();
      frameTimes.push(now);
      while (frameTimes.length > 0 && ((_a = frameTimes[0]) != null ? _a : 0) < now - 1e3) frameTimes.shift();
      options.onFrame(world, paused, still());
    }
    function paint(now) {
      if (still()) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(atlases.stillImage, 0, 0, STAGE_W, STAGE_H);
        frames += 1;
        publish(now);
        return;
      }
      const bubble = draw(ctx, atlases, world, plaza, false);
      if (bubble) sawBubble = true;
      frames += 1;
      publish(now);
    }
    function paintIntro(now) {
      const state = assemble.render(ctx, introT);
      frames += 1;
      publish(now);
      emit(state);
    }
    function finishIntro() {
      if (still()) {
        introOn = false;
        emitChrome("off");
        return;
      }
      if (!introOn && introT >= assemble.totalTime) return;
      introOn = false;
      introT = assemble.totalTime;
      paint(performance.now());
      emitChrome("done");
      if (!paused && !still()) {
        last = performance.now();
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      }
    }
    function replayIntro() {
      if (still()) return;
      assemble.reset();
      sawBubble = false;
      introOn = true;
      introT = 0;
      cancelAnimationFrame(raf);
      last = performance.now();
      paintIntro(performance.now());
      if (!paused) raf = requestAnimationFrame(loop);
    }
    function loop(now) {
      if (paused || still()) return;
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1e3));
      last = now;
      if (introOn) {
        introT += dt;
        if (introT < assemble.uiAt) {
          paintIntro(now);
          return;
        }
        if (introT >= assemble.totalTime) {
          introOn = false;
          introT = assemble.totalTime;
          tick(world, dt);
          paint(now);
          emitChrome("done");
          return;
        }
        tick(world, dt);
        paint(now);
        emitChrome("ui");
        return;
      }
      tick(world, dt);
      paint(now);
    }
    function syncPause() {
      const next = document.hidden || document.visibilityState === "hidden" || !onScreen;
      if (next === paused) return;
      paused = next;
      if (paused || still()) cancelAnimationFrame(raf);
      publish(performance.now());
      if (!paused && !still()) {
        last = performance.now();
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      }
    }
    if (introOn) paintIntro(performance.now());
    else paint(performance.now());
    if (!still() && !paused) raf = requestAnimationFrame(loop);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    media.addEventListener("change", () => {
      if (still()) {
        introOn = false;
        cancelAnimationFrame(raf);
        paint(performance.now());
        emitChrome("off");
        return;
      }
      if (!paused) {
        last = performance.now();
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      }
      publish(performance.now());
    });
    document.addEventListener("visibilitychange", syncPause);
    const stage = options.canvas.parentElement;
    if (stage) {
      const observer = new IntersectionObserver(
        (entries) => {
          onScreen = entries.some((entry) => entry.isIntersecting);
          syncPause();
        },
        { threshold: 0.02 }
      );
      observer.observe(stage);
    }
    performance.mark("hero-scene-start");
    return {
      art: atlases.manifest.source,
      note: atlases.manifest.note,
      greet(id) {
        const actor = world.actors.find((item) => item.id === id);
        if (!actor) return;
        actor.facing = "down";
        const greeting = document.querySelector("#greeting");
        if (greeting) greeting.textContent = `${actor.name}: ${actor.line}`;
        const hint = document.querySelector("#hint");
        if (hint instanceof HTMLElement) hint.hidden = true;
        paint(performance.now());
      },
      skipIntro: finishIntro,
      replayIntro
    };
  }
  return __toCommonJS(entry_exports);
})();
