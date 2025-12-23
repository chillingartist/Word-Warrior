
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

interface BattleSceneProps {
    playerIds: {
        skinColor: string;
        hairColor: string;
        armorId: string;
        weaponId: string;
        modelColor?: string;
    };
    enemyIds: {
        skinColor: string;
        armorId: string;
        weaponId: string;
    };
    combatEvent: { type: 'attack' | 'hit' | 'block'; target: 'player' | 'enemy'; damage?: number } | null;
}

const BattleScene: React.FC<BattleSceneProps> = ({ playerIds, enemyIds, combatEvent }) => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const parentEl = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<Phaser.Scene | null>(null);
    const hitScaleRatioRef = useRef<number>(1);
    const attackScaleRatioRef = useRef<number>(1);

    useEffect(() => {
        if (!parentEl.current) return;

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: parentEl.current,
            width: 800,
            height: 400,
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            transparent: true,
            physics: {
                default: 'arcade',
                arcade: { gravity: { x: 0, y: 0 } }
            },
            scene: {
                preload: preload,
                create: create,
                update: update
            }
        };

        const game = new Phaser.Game(config);
        gameRef.current = game;

        function preload(this: Phaser.Scene) {
            // Load as plain image first to inspect dimensions dynamically
            // Load all color variants
            this.load.image('warrior_idle_blue', '/assets/warrior/warrior_idle_v3.png?v=6');
            this.load.image('warrior_idle_red', '/assets/warrior/warrior_idle_red.png?v=6');
            this.load.image('warrior_idle_yellow', '/assets/warrior/warrior_idle_yellow.png?v=6');
            this.load.image('warrior_idle_purple', '/assets/warrior/warrior_idle_purple.png?v=6');
            this.load.image('warrior_idle_black', '/assets/warrior/warrior_idle_black.png?v=6');

            // Combat Animations - Load Blue (Default/Raw)
            this.load.image('warrior_hit_blue', '/assets/warrior/warrior_hit.png');
            this.load.image('warrior_attack_1_blue', '/assets/warrior/warrior_attack_1.png');
            this.load.image('warrior_attack_2_blue', '/assets/warrior/warrior_attack_2.png');

            // Combat Animations - Load Red
            this.load.image('warrior_hit_red', '/assets/warrior/warrior_hit_red.png');
            this.load.image('warrior_attack_1_red', '/assets/warrior/warrior_attack_1_red.png');
            this.load.image('warrior_attack_2_red', '/assets/warrior/warrior_attack_2_red.png');

            // Combat Animations - Load Yellow
            this.load.image('warrior_hit_yellow', '/assets/warrior/warrior_hit_yellow.png');
            this.load.image('warrior_attack_1_yellow', '/assets/warrior/warrior_attack_1_yellow.png');
            this.load.image('warrior_attack_2_yellow', '/assets/warrior/warrior_attack_2_yellow.png');

            // Combat Animations - Load Purple
            this.load.image('warrior_hit_purple', '/assets/warrior/warrior_hit_purple.png');
            this.load.image('warrior_attack_1_purple', '/assets/warrior/warrior_attack_1_purple.png');
            this.load.image('warrior_attack_2_purple', '/assets/warrior/warrior_attack_2_purple.png');

            // Combat Animations - Load Black (Newly added)
            // Assuming fallback for others until provided
            this.load.image('warrior_hit_black', '/assets/warrior/warrior_hit_black.png');
            this.load.image('warrior_attack_1_black', '/assets/warrior/warrior_attack_1_black.png');
            this.load.image('warrior_attack_2_black', '/assets/warrior/warrior_attack_2_black.png');
        }

        function create(this: Phaser.Scene) {
            sceneRef.current = this;

            // --- 1. SETUP ANIMATIONS HELPER ---
            const createAnimFromRaw = (keyRaw: string, keyFinal: string, animKey: string, framesCount: number, rate: number = 10, repeat: number = -1): number | undefined => {
                if (!this.textures.exists(keyRaw)) return undefined;

                const rawTex = this.textures.get(keyRaw);
                const source = rawTex.getSourceImage() as any;
                if (source.width === 0 || source.height === 0) return undefined;

                const fWidth = Math.floor(source.width / framesCount);
                const fHeight = source.height;

                if (this.textures.exists(keyFinal)) this.textures.remove(keyFinal);

                this.textures.addSpriteSheet(keyFinal, source, {
                    frameWidth: fWidth,
                    frameHeight: fHeight
                });

                if (this.anims.exists(animKey)) this.anims.remove(animKey);

                const frames = this.anims.generateFrameNumbers(keyFinal, { start: 0, end: framesCount - 1 });
                if (frames.length > 0) {
                    this.anims.create({
                        key: animKey,
                        frames: frames,
                        frameRate: rate,
                        repeat: repeat
                    });
                }

                return fWidth;
            };

            // --- 2. CREATE SPECIFIC ANIMATIONS ---
            const colors = ['blue', 'red', 'yellow', 'purple', 'black'];

            // Helper to get width of animation for scaling calculations
            // We use Blue as the reference for scaling ratios
            let referenceIdleWidth: number | undefined;
            let referenceHitWidth: number | undefined;
            let referenceAtkWidth: number | undefined;

            colors.forEach(color => {
                // Idle (8 frames)
                const wIdle = createAnimFromRaw(`warrior_idle_${color}`, `warrior_sheet_${color}`, `warrior_anim_${color}`, 8, 10, -1);
                if (color === 'blue') referenceIdleWidth = wIdle;

                // Hit (6 frames) - check if specific color asset exists, if not use blue
                let hitKey = `warrior_hit_${color}`;
                if (!this.textures.exists(hitKey)) hitKey = 'warrior_hit_blue';
                const wHit = createAnimFromRaw(hitKey, `warrior_hit_sheet_${color}`, `warrior_hit_anim_${color}`, 6, 10, 0);
                if (color === 'blue') referenceHitWidth = wHit;

                // Attack 1 (4 frames)
                let atk1Key = `warrior_attack_1_${color}`;
                if (!this.textures.exists(atk1Key)) atk1Key = 'warrior_attack_1_blue';
                createAnimFromRaw(atk1Key, `warrior_attack_1_sheet_${color}`, `warrior_attack_1_anim_${color}`, 4, 12, 0);

                // Attack 2 (4 frames)
                let atk2Key = `warrior_attack_2_${color}`;
                if (!this.textures.exists(atk2Key)) atk2Key = 'warrior_attack_2_blue';
                const wAtk = createAnimFromRaw(atk2Key, `warrior_attack_2_sheet_${color}`, `warrior_attack_2_anim_${color}`, 4, 12, 0);
                if (color === 'blue') referenceAtkWidth = wAtk;
            });

            if (referenceIdleWidth && referenceHitWidth) {
                hitScaleRatioRef.current = referenceIdleWidth / referenceHitWidth;
            }
            if (referenceIdleWidth && referenceAtkWidth) {
                attackScaleRatioRef.current = referenceIdleWidth / referenceAtkWidth;
            }

            // --- 3. CREATE CHARACTERS ---
            createWarrior(this, 200, 250, 'player', playerIds);
            createWarrior(this, 600, 250, 'enemy', enemyIds);

            const enemy = this.children.getByName('enemy') as Phaser.GameObjects.Container;
            if (enemy) {
                enemy.setScale(-1, 1); // Face left
                const sprite = enemy.getByName('sprite') as Phaser.GameObjects.Sprite;
                if (sprite) sprite.setTint(0xffffff);
            }
        }

        function update(this: Phaser.Scene) {
            // Sprites handle their own animation playback, no need for manual bobbing unless desired
            // Keeping bobbing for the container can add extra life
            const player = this.children.getByName('player') as Phaser.GameObjects.Container;
            const enemy = this.children.getByName('enemy') as Phaser.GameObjects.Container;

            // Subtle breathing/bobbing
            if (player) {
                player.y = 250 + Math.sin(this.time.now / 600) * 2;
            }
            if (enemy) {
                enemy.y = 250 + Math.sin(this.time.now / 700 + 1) * 2;
            }
        }

        return () => {
            game.destroy(true);
        };
    }, []);

    // --- RE-RENDER VISUALS WHEN PROPS CHANGE ---
    // --- RE-RENDER VISUALS WHEN PROPS CHANGE ---
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        const updateChar = (name: string, data: any) => {
            const container = scene.children.getByName(name) as Phaser.GameObjects.Container;
            if (!container) return;
            const sprite = container.getByName('sprite') as Phaser.GameObjects.Sprite;
            if (!sprite) return;

            const color = (data as any).modelColor || 'blue';
            // Check if animation exists
            const animKey = `warrior_anim_${color}`;
            const finalAnim = scene.anims.exists(animKey) ? animKey : 'warrior_anim_blue';

            // Only play if not already playing (handled by true arg)
            sprite.play(finalAnim, true);
        };

        updateChar('player', playerIds);
        updateChar('enemy', enemyIds);
    }, [playerIds, enemyIds]);

    // --- COMBAT ANIMATIONS ---
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !combatEvent) return;

        let attackerName = combatEvent.target === 'player' ? 'enemy' : 'player';
        const attacker = scene.children.getByName(attackerName) as Phaser.GameObjects.Container;
        const victim = scene.children.getByName(combatEvent.target) as Phaser.GameObjects.Container;

        if (!attacker || !victim) return;

        // Determine colors
        const victimColor = (combatEvent.target === 'player' ? (playerIds as any).modelColor : 'blue') || 'blue';
        const attackerColor = (attackerName === 'player' ? (playerIds as any).modelColor : 'blue') || 'blue';

        // 1. Play Hit Animation on Victim
        const victimSprite = victim.getByName('sprite') as Phaser.GameObjects.Sprite;
        if (victimSprite) {
            // Stop any existing animation and play hit. forceRestart = true
            // Apply scale correction if hit texture is different size
            const baseScale = 2.5;
            victimSprite.setScale(baseScale * hitScaleRatioRef.current);

            victimSprite.play(`warrior_hit_anim_${victimColor}`, true);

            // Return to idle after. 'animationcomplete' fires when non-looping anim finishes
            victimSprite.once('animationcomplete', () => {
                victimSprite.setScale(baseScale); // Reset scale
                victimSprite.play(`warrior_anim_${victimColor}`, true);
            });
        }

        if (combatEvent.type === 'attack') {
            // 2. Play Random Attack Animation on Attacker
            const attackerSprite = attacker.getByName('sprite') as Phaser.GameObjects.Sprite;
            if (attackerSprite) {
                const isAtk1 = Math.random() > 0.5;
                const animKey = isAtk1 ? `warrior_attack_1_anim_${attackerColor}` : `warrior_attack_2_anim_${attackerColor}`;
                const baseScale = 2.5;

                attackerSprite.setScale(baseScale * attackScaleRatioRef.current);
                attackerSprite.play(animKey, true);

                attackerSprite.once('animationcomplete', () => {
                    attackerSprite.setScale(baseScale);
                    const color = (attackerName === 'player' ? (playerIds as any).modelColor : 'blue') || 'blue';
                    attackerSprite.play(`warrior_anim_${color}`, true);
                });
            }

            // 3. Lunge Tween (Match duration to animation approx)
            const startX = attacker.x;
            const lungeDist = 40; // Smaller lunge since sprite moves a bit
            const lungX = attackerName === 'player' ? startX + lungeDist : startX - lungeDist;

            scene.tweens.add({
                targets: attacker,
                x: lungX,
                duration: 200,
                yoyo: true,
                ease: 'Power1',
                onYoyo: () => {
                    // 4. Impact Effect
                    const color = attackerName === 'player' ? 0xffffff : 0xff4444;
                    createSlashEffect(scene, victim.x, victim.y, color);

                    // 5. Shake Victim
                    scene.tweens.add({
                        targets: victim,
                        x: victim.x + (Math.random() * 10 - 5),
                        duration: 50,
                        yoyo: true,
                        repeat: 3
                    });
                }
            });
        }

    }, [combatEvent]);

    // --- HELPERS ---

    function createWarrior(scene: Phaser.Scene, x: number, y: number, name: string, data: any) {
        const container = scene.add.container(x, y);
        container.setName(name);

        // Add Sprite
        const color = (data as any).modelColor || 'blue';
        const idleAnim = `warrior_anim_${color}`;
        // Fallback to blue if specific anim doesn't exist (though we created all)
        const finalAnim = scene.anims.exists(idleAnim) ? idleAnim : 'warrior_anim_blue';

        if (scene.anims.exists(finalAnim)) {
            const sprite = scene.add.sprite(0, -32, `warrior_sheet_${color}`); // Initial texture
            sprite.setName('sprite');
            sprite.play(finalAnim);
            sprite.setScale(2.5); // Pixel art scaling
            container.add(sprite);
        } else {
            // Fallback text if something failed
            const text = scene.add.text(0, 0, '?', { fontSize: '32px' });
            container.add(text);
        }

        // Shadow
        const shadow = scene.add.ellipse(0, 30, 40, 10, 0x000000, 0.3);
        container.addAt(shadow, 0); // Add at bottom

        return container;
    }

    // Removed legacy drawWarriorGraphics / drawWeapon

    function createSlashEffect(scene: Phaser.Scene, x: number, y: number, color: number) {
        const slash = scene.add.graphics({ x, y });
        slash.lineStyle(4, color, 1);
        slash.beginPath();
        slash.moveTo(-20, -20);
        slash.lineTo(20, 20);
        slash.strokePath();

        scene.tweens.add({
            targets: slash,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 200,
            onComplete: () => slash.destroy()
        });
    }

    // Mobile needs a shorter scene height to keep answer options above the bottom nav.
    return <div ref={parentEl} className="w-full h-[220px] sm:h-[260px] md:h-[400px] overflow-hidden rounded-3xl" />;
};

export default BattleScene;
