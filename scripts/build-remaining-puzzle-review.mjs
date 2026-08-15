import fs from "node:fs";

const associations = {
  water: ["river", "mirror"], air: ["wind", "breath"], heat: ["fire", "fever"], light: ["color", "window"],
  gravity: ["fall", "anchor"], pressure: ["squeeze", "crowd"], sound: ["echo", "music"], electricity: ["charge", "lightning"],
  motion: ["speed", "dance"], friction: ["grip", "brakes"], energy: ["fuel", "food"], carbon: ["coal", "skeleton"],
  oxygen: ["breath", "rust"], salt: ["ocean", "tears"], sugar: ["candy", "fuel"], protein: ["muscle", "knots"],
  fat: ["oil", "candle"], acid: ["sour", "bite"], bacteria: ["culture", "crowd"], cells: ["tissue", "rooms"],
  blood: ["river", "delivery"], nerves: ["wires", "alarm"], muscle: ["pull", "engine"], bones: ["frame", "stone"],
  skin: ["shield", "map"], hair: ["fur", "antenna"], eyes: ["camera", "window"], ears: ["radar", "shells"],
  brain: ["memory", "conductor"], hormones: ["signals", "mail"], genes: ["code", "recipe"], seeds: ["travel", "future"],
  roots: ["anchor", "plumbing"], leaves: ["solar", "flags"], flowers: ["color", "invitation"], insects: ["swarm", "workers"],
  feathers: ["flight", "coat"], fur: ["warmth", "blanket"], shell: ["armor", "house"], web: ["net", "internet"],
  poison: ["defense", "warning"], disguise: ["hiding", "costume"], time: ["aging", "river"], weather: ["climate", "mood"],
  ice: ["cold", "glass"], rock: ["mountain", "memory"], metal: ["wire", "bones"], glass: ["window", "ice"],
  wood: ["rings", "history"], rubber: ["bounce", "spring"], steam: ["cloud", "engine"], gas: ["bubbles", "ghost"],
  oil: ["grease", "fuel"], sand: ["beach", "clock"], dust: ["soil", "history"], fire: ["smoke", "hunger"],
  thread: ["stitch", "path"], fear: ["danger", "shadow"], paper: ["books", "tree"], defense: ["walls", "shield"],
  price: ["money", "gate"], travel: ["road", "suitcase"], code: ["language", "lock"], pattern: ["rhythm", "puzzle"],
  waves: ["ocean", "dance"], echo: ["cave", "memory"], color: ["rainbow", "mood"], angle: ["corner", "view"],
};

const raw = String.raw`
Why can camels go so long without drinking?|water
How do fish take oxygen from water?|oxygen
Why do polar bears stay warm?|fur
How can bats find insects in darkness?|sound
Why do elephants have such large ears?|ears
How can kangaroos travel efficiently?|motion
Why do zebras have stripes?|disguise
How do beavers change a stream?|wood
Why can seals stay underwater so long?|oxygen
How do dolphins communicate across water?|sound
Why do cats land on their feet?|motion
How can dogs follow an old scent trail?|air
Why do rabbits have powerful back legs?|muscle
How do squirrels survive falls from trees?|gravity
Why do horses sleep standing up?|bones
How do goats climb steep cliffs?|friction
Why can cows digest grass?|bacteria
How do whales stay warm in cold seas?|fat
Why do otters hold hands while sleeping?|water
How can a mole navigate underground?|hair
Why do skunks advertise before spraying?|poison
How do porcupine quills protect them?|hair
Why can sloths hang for hours?|muscle
How do raccoons identify objects by touch?|nerves
Why do deer shed their antlers?|bones
How can a fox hear prey under snow?|ears
Why do wolves howl together?|sound
How do meerkats coordinate guard duty?|eyes
Why can mountain lions jump so far?|muscle
How do platypuses find prey underwater?|electricity
Why do flamingos often stand on one leg?|heat
How can penguins huddle without overheating?|motion
Why do owls rotate their heads so far?|bones
How do hummingbirds hover?|feathers
Why are peacock feathers colorful?|light
How can geese fly in a V formation?|air
Why do woodpeckers avoid brain injury?|bones
How do pigeons find their way home?|gravity
Why can ducks sleep with one eye open?|brain
How do pelicans carry fish?|skin
Why do albatrosses glide for hours?|air
How can kingfishers dive without dazzling themselves?|eyes
Why do parrots imitate sounds?|brain
How do chickens make eggshells?|shell
Why can ostriches run so quickly?|muscle
How do crows solve puzzles?|brain
Why do vultures circle high overhead?|heat
How can seabirds drink salty water?|salt
Why do robins pull worms after rain?|sound
How do swallows catch insects while flying?|feathers
Why do bees make honey?|sugar
How can ants carry more than their body weight?|muscle
Why do butterflies taste with their feet?|nerves
How do moths find distant mates?|air
Why do dragonflies have enormous eyes?|eyes
How can grasshoppers jump so far?|muscle
Why do cicadas spend years underground?|time
How do mosquitoes find warm animals?|heat
Why do ladybugs have bright colors?|poison
How can water striders walk on ponds?|water
Why do oak trees produce so many acorns?|seeds
How can dandelion seeds travel miles?|air
Why do pinecones open when dry?|water
How do maple seeds spin as they fall?|air
Why do berries become sweet when ripe?|sugar
How can coconuts cross oceans?|water
Why do mangrove roots rise above mud?|air
How do desert plants avoid losing water?|skin
Why do some flowers open only at night?|time
How can orchids imitate female insects?|disguise
Why do nettles sting?|poison
How does bamboo grow so quickly?|cells
Why can ivy cling to brick walls?|roots
How do water lilies keep leaves afloat?|air
Why do ferns reproduce without flowers?|dust
How can moss survive drying out?|water
Why do onions store food underground?|sugar
How does a potato grow new plants from its eyes?|cells
Why do carrots store sugar in roots?|sugar
How can beans improve poor soil?|bacteria
Why do pea plants curl around supports?|motion
How do carnivorous plants digest insects?|acid
Why does cut grass have a strong smell?|air
How can trees pull water to their highest leaves?|water
Why does bark protect a tree?|skin
How do roots split cracks in pavement?|pressure
Why do seedlings bend around obstacles?|hormones
How can a forest make its own rain?|water
Why do fallen leaves disappear into soil?|bacteria
How do fungi help tree roots gather minerals?|web
Why does clover close its leaves at night?|time
How can plants warn neighbors about insects?|air
Why do flowers make nectar?|sugar
How do burrs hitch rides on animals?|hair
Why can seaweed bend without breaking?|water
How does kelp stay near sunlight?|gas
Why are some algae red?|light
How can coral reefs grow from tiny animals?|rock
Why do wetlands reduce flooding?|water
How can prairie roots survive fire?|roots
Why does the heart beat without conscious control?|electricity
How do lungs create such a large exchange surface?|cells
Why is blood red?|protein
How can blood stop flowing from a cut?|protein
Why do bruises change color?|blood
How does skin make vitamin D?|light
Why do fingertips wrinkle in water?|nerves
How does sweat cool the body?|water
Why do we shiver when cold?|muscle
How do goosebumps form?|muscle
Why does hair turn gray?|cells
How do fingernails grow?|cells
Why are bones hollow inside?|bones
How can bones repair a fracture?|cells
Why do joints contain slippery fluid?|friction
How do tendons transfer force?|muscle
Why do muscles become sore after unfamiliar work?|protein
How can the stomach avoid digesting itself?|skin
Why does stomach acid not kill every gut microbe?|bacteria
How do intestines absorb so much food?|cells
Why does the liver store sugar?|sugar
How do kidneys clean the blood?|pressure
Why is urine yellow?|blood
How does the bladder know when it is full?|nerves
Why do we need two lungs?|air
How does the diaphragm pull air inward?|pressure
Why do we cough?|nerves
How does mucus protect airways?|skin
Why do eyes produce tears?|salt
How does the pupil control incoming light?|light
Why can eyes adapt to darkness?|cells
How do glasses correct blurry vision?|glass
Why do we have a blind spot?|nerves
How does the inner ear control balance?|motion
Why do ears pop on an airplane?|pressure
How do vocal cords make sound?|air
Why does a whisper lack a normal tone?|sound
How does the tongue detect sweetness?|sugar
Why does smell affect flavor?|brain
How do teeth survive years of chewing?|rock
Why do baby teeth fall out?|bones
How does saliva protect teeth?|water
Why does the brain need so much energy?|sugar
How do memories become stronger with practice?|brain
Why do we dream during sleep?|brain
How does pain warn the body?|nerves
Why can stress make a heart race?|hormones
How does insulin lower blood sugar?|hormones
Why do identical twins still differ?|genes
How does a fever help fight infection?|heat
Why do vaccines train immune memory?|protein
How can a scar become paler over time?|skin
Why does a paper cut hurt so much?|nerves
How does a compass point north?|metal
Why does a pendulum keep a steady rhythm?|gravity
How can a lever lift a heavy object?|motion
Why does a pulley reduce the needed force?|motion
How do gears change speed?|motion
Why does a screw hold wood together?|friction
How does a spring store energy?|metal
Why can rubber stretch and return?|rubber
How does a suction cup hold to glass?|pressure
Why does a knot tighten under load?|friction
How can a wheel reduce resistance?|friction
Why do ball bearings help machines turn?|metal
How does a door hinge carry weight?|metal
Why does a wrench have a long handle?|motion
How can scissors multiply hand force?|motion
Why does sandpaper smooth wood?|friction
How does a nail stay in a board?|friction
Why does a drill bit have spiral grooves?|motion
How can a saw cut without removing one solid slice?|friction
Why does a hammer have a heavy head?|motion
How does a thermometer measure temperature?|heat
Why does a thermostat switch heating on and off?|electricity
How does a smoke detector notice a fire?|light
Why does a fuse melt during a fault?|heat
How does a circuit breaker protect wires?|electricity
Why do electrical plugs have metal prongs?|metal
How does a battery create electric current?|acid
Why do rechargeable batteries wear out?|time
How does an LED make light?|electricity
Why does a dimmer change a lamp's brightness?|electricity
How does a speaker turn current into music?|motion
Why does a microphone need a moving membrane?|sound
How can headphones cancel noise?|sound
Why does a radio need an antenna?|air
How does a camera focus an image?|glass
Why does a digital screen use tiny colored lights?|light
How does a touchscreen notice a finger?|electricity
Why does a computer need memory?|brain
How can a barcode store a number?|light
Why does a QR code still work when partly damaged?|eyes
How does a printer place ink accurately?|motion
Why does paper jam in a printer?|friction
How does a refrigerator door seal?|rubber
Why does an oven window use layered glass?|heat
How does a vacuum cleaner move dust?|air
Why does a washing machine spin quickly?|motion
How does a dishwasher remove grease?|heat
Why does an iron flatten wrinkles?|heat
How does a sewing machine form a stitch?|thread
Why does a fan make skin feel cooler?|water
How does an air conditioner move heat outdoors?|gas
Why does a humidifier make visible mist?|water
How does a fire extinguisher stop flames?|gas
Why does a candle flame point upward?|heat
How does a match begin burning?|friction
Why does charcoal keep glowing?|carbon
How does a chimney pull smoke upward?|heat
Why does a thermos have shiny inner walls?|light
How does an umbrella shed rain?|skin
Why does a raincoat stop water but allow some vapor out?|skin
How does a tent stay upright in wind?|pressure
Why does a sleeping bag trap warmth?|air
How does a life jacket keep someone afloat?|air
Why does a canoe turn when paddled on one side?|water
How does a surfboard ride a wave?|water
Why does a boomerang curve back?|air
How does a kite climb against its string?|air
Why does a frisbee stay level while flying?|motion
How does a roller coaster stay on the track?|gravity
Why do trains use steel wheels?|friction
How does a bicycle chain transfer force?|metal
Why do car tires have tread?|friction
How does power steering make turning easier?|pressure
Why does an engine need oil?|friction
How does a radiator cool an engine?|water
Why does gasoline release so much energy?|carbon
How does a catalytic converter clean exhaust?|metal
Why do airbags inflate so quickly?|gas
How does a seat belt lock during a crash?|motion
Why do boats make a wake?|water
How does a submarine control its depth?|water
Why can a steel ship float?|air
How does an airplane propeller create thrust?|air
Why are airplane windows rounded?|pressure
How does a helicopter hover?|air
Why does a rocket work in empty space?|gas
How does a satellite stay in orbit?|gravity
Why do meteors glow in the atmosphere?|heat
How can radar measure distance?|sound
Why does GPS need several satellites?|time
How do mountains affect rainfall?|air
Why does the ocean have currents?|heat
How do waves reshape a coastline?|energy
Why are river deltas shaped like fans?|sand
How does groundwater move through rock?|water
Why can a spring flow from a hillside?|pressure
How does a geyser erupt repeatedly?|steam
Why are hot springs warm?|rock
How do glaciers carve valleys?|ice
Why do icebergs show only a small part above water?|water
How does sea ice change ocean saltiness?|salt
Why does permafrost preserve old animals?|ice
How can wind polish exposed stone?|sand
Why do sinkholes suddenly collapse?|water
How do mud cracks form?|water
Why are some lakes pink?|bacteria
How can a lake become poisonous to fish?|oxygen
Why does ocean water glow at night sometimes?|light
How do coral animals build limestone skeletons?|rock
Why does El Niño change weather far away?|heat
How can volcanic ash cool the planet?|light
Why does smoke make sunsets redder?|light
How does a tornado form a narrow funnel?|air
Why can snowstorms produce lightning?|electricity
How does freezing rain coat trees in ice?|water
Why does black ice look invisible?|light
How can dust travel between continents?|air
Why does the equator receive more sunlight?|light
How do time zones follow Earth's rotation?|time
Why does the International Date Line bend?|time
How did sailors estimate latitude from stars?|eyes
Why did early maps include sea monsters?|fear
How did paper money make trade easier?|paper
Why were ancient roads often built straight?|time
How did aqueducts move water without pumps?|gravity
Why did castles use spiral staircases?|defense
How did lighthouses help ships before radio?|light
Why did semaphore towers need clear weather?|eyes
How did telegraphs send words through wires?|electricity
Why did early photographs require long poses?|light
How did phonographs store sound?|motion
Why did typewriters arrange keys awkwardly?|motion
How did carbon paper make copies?|pressure
Why were books once chained to desks?|price
How did movable type speed up printing?|metal
Why did newspapers use large headlines?|eyes
How can a dictionary show pronunciation?|sound
Why do languages borrow words?|travel
How does a rhyme help memory?|sound
Why can the same word develop opposite meanings?|time
How does punctuation change a sentence's rhythm?|sound
Why do alphabets use a limited set of symbols?|code
How can handwriting reveal the tool used?|friction
Why does cursive connect letters?|motion
How does a melody remain recognizable in another key?|pattern
Why do drums sound different when tightened?|pressure
How does a violin bow keep a string vibrating?|friction
Why do larger instruments often sound lower?|air
How can harmony create tension and release?|waves
Why does a room change how music sounds?|echo
How can paint create the illusion of distance?|light
Why do complementary colors look vivid together?|color
How does perspective make a flat picture seem deep?|angle
Why can a sculpture appear balanced while leaning?|gravity
How does animation turn still drawings into motion?|time
`.trim();

const bases = raw.split("\n").map((line, index) => {
  const [question, target] = line.split("|");
  if (!question || !target || !associations[target]) throw new Error(`Bad source row ${index + 1}: ${line}`);
  return { question, target, related: associations[target][0], devious: associations[target][1] };
});

if (bases.length < 275) throw new Error(`Expected at least 275 source questions, found ${bases.length}.`);
const pool = bases.slice(0, 275);

function puzzleCell(item, target) {
  return `[ ] ${item.question} → **${target}**`;
}

function makeFile(startDay, endDay, fileName) {
  const lines = [
    `# Daily Three puzzle review — days ${String(startDay).padStart(3, "0")}–${String(endDay).padStart(3, "0")}`,
    "",
    "Mark acceptable puzzles with `[x]`; add `REPLACE` or a note beside anything that should go.",
    "",
    "| Day | Gentle | Tricky | Devious |",
    "|---:|---|---|---|",
  ];

  for (let day = startDay; day <= endDay; day += 1) {
    const offset = day - 91;
    const gentle = pool[offset];
    const tricky = pool[(offset + 92) % pool.length];
    const devious = pool[(offset + 184) % pool.length];
    lines.push(`| ${String(day).padStart(3, "0")} | ${puzzleCell(gentle, gentle.target)} | ${puzzleCell(tricky, tricky.related)} | ${puzzleCell(devious, devious.devious)} |`);
  }
  fs.writeFileSync(new URL(`../${fileName}`, import.meta.url), `${lines.join("\n")}\n`);
}

makeFile(91, 180, "daily-three-review-02.md");
makeFile(181, 270, "daily-three-review-03.md");
makeFile(271, 365, "daily-three-review-04.md");

console.log(`Generated ${pool.length * 3} puzzle entries across days 091–365.`);
