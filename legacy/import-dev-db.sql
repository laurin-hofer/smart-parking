BEGIN;

DELETE FROM "event_logs";

DELETE FROM "hardware_events";

DELETE FROM "parking_sessions";

DELETE FROM "parking_spots";

DELETE FROM "vehicles";

DELETE FROM "system_state";

INSERT INTO "vehicles" ("id", "licensePlate", "ownerName", "note", "isAllowed", "createdAt") VALUES
('cmpfb8j060008bqkb0dnmn2fg', 'W-123AB', 'Anna Berger', 'Monthly pass', TRUE, to_timestamp(1779357034807 / 1000.0)),
('cmpfb8j06000bbqkbe22bx7b1', 'I-404CD', 'Markus Leitner', 'Access disabled', FALSE, to_timestamp(1779357034807 / 1000.0)),
('cmpfb8j060009bqkb7peyejyi', 'KU-77EF', 'Sofia Steiner', 'VIP customer', TRUE, to_timestamp(1779357034807 / 1000.0)),
('cmpfb8j06000abqkba5iht0cg', 'SZ-808GP', 'Noah Huber', NULL, TRUE, to_timestamp(1779357034807 / 1000.0)),
('cmpfbirhp0001ej42v7ugrixt', 'DEMO-J6XBY', 'Guest', NULL, TRUE, to_timestamp(1779357512365 / 1000.0)),
('cmpfbiyej0007ej42xlqzv9tc', 'DEMO-55SB4', 'Guest', NULL, TRUE, to_timestamp(1779357521324 / 1000.0)),
('cmpfbr18r000lej42rd4opm41', 'DEMO-3LIFJ', 'Guest', NULL, TRUE, to_timestamp(1779357898251 / 1000.0)),
('cmpfbr25x000rej428etm4h2j', 'DEMO-QAMKX', 'Guest', NULL, TRUE, to_timestamp(1779357899446 / 1000.0)),
('cmpfbr2ux000xej42pzl36pg7', 'DEMO-0Q1RE', 'Guest', NULL, TRUE, to_timestamp(1779357900345 / 1000.0)),
('cmpfbr3ey0013ej42m4loe743', 'DEMO-RYNJQ', 'Guest', NULL, TRUE, to_timestamp(1779357901067 / 1000.0));

INSERT INTO "parking_spots" ("id", "code", "status", "sensorId", "lastSensorAt", "createdAt", "updatedAt") VALUES
('cmpfb8ix70001bqkb0op1ogky', 'A-1', 'FREE', 'sensor_a_1', NULL, to_timestamp(1779357034698 / 1000.0), to_timestamp(1780303897079 / 1000.0)),
('cmpfb8ix60000bqkbvs4mm51c', 'A-2', 'FREE', 'sensor_a_2', NULL, to_timestamp(1779357034698 / 1000.0), to_timestamp(1780303896154 / 1000.0)),
('cmpfb8ix80006bqkbt15lfr0l', 'A-3', 'FREE', 'sensor_a_3', NULL, to_timestamp(1779357034698 / 1000.0), to_timestamp(1780303895197 / 1000.0)),
('cmpfb8ix80005bqkbqy0dgq1v', 'A-4', 'FREE', 'sensor_a_4', NULL, to_timestamp(1779357034698 / 1000.0), to_timestamp(1780303894233 / 1000.0)),
('cmpfb8ix80004bqkbx7r2443u', 'A-5', 'FREE', 'sensor_a_5', NULL, to_timestamp(1779357034698 / 1000.0), to_timestamp(1780303893264 / 1000.0)),
('cmpfb8ix80003bqkb7ps54cf4', 'A-6', 'FREE', 'sensor_a_6', NULL, to_timestamp(1779357034698 / 1000.0), to_timestamp(1780303892353 / 1000.0)),
('cmpfb8ix80007bqkbhzh44z92', 'A-7', 'FREE', 'sensor_a_7', NULL, to_timestamp(1779357034699 / 1000.0), to_timestamp(1780303891199 / 1000.0)),
('cmpfb8ix80002bqkb70zawovm', 'A-8', 'FREE', 'sensor_a_8', NULL, to_timestamp(1779357034698 / 1000.0), to_timestamp(1780303890205 / 1000.0));

INSERT INTO "system_state" ("id", "entryLocked", "entryLockedAt", "latestPendingPlate", "updatedAt") VALUES
('singleton', FALSE, NULL, NULL, to_timestamp(1779357907152 / 1000.0));

INSERT INTO "parking_sessions" ("id", "vehicleId", "spotId", "status", "enteredAt", "paidAt", "exitedAt", "exitAllowed", "paymentMethod", "priceCents", "createdAt", "updatedAt") VALUES
('cmpfb8j16000dbqkb8knwvs60', 'cmpfb8j060008bqkb0dnmn2fg', 'cmpfb8ix70001bqkb0op1ogky', 'EXITED', to_timestamp(1779354814838 / 1000.0), NULL, to_timestamp(1779357510116 / 1000.0), FALSE, NULL, 0, to_timestamp(1779357034842 / 1000.0), to_timestamp(1779357510122 / 1000.0)),
('cmpfb8j1d000fbqkbfj0wgq3w', 'cmpfb8j060009bqkb7peyejyi', 'cmpfb8ix60000bqkbvs4mm51c', 'EXITED', to_timestamp(1779351634848 / 1000.0), to_timestamp(1779356734848 / 1000.0), to_timestamp(1779357510116 / 1000.0), TRUE, 'card', 450, to_timestamp(1779357034849 / 1000.0), to_timestamp(1779357510122 / 1000.0)),
('cmpfbiri80004ej42aapulxjc', 'cmpfbirhp0001ej42v7ugrixt', 'cmpfb8ix70001bqkb0op1ogky', 'EXITED', to_timestamp(1779357512384 / 1000.0), NULL, to_timestamp(1780303897082 / 1000.0), TRUE, NULL, 78870, to_timestamp(1779357512384 / 1000.0), to_timestamp(1780303897084 / 1000.0)),
('cmpfbiyey000aej42kgpaef9z', 'cmpfbiyej0007ej42xlqzv9tc', 'cmpfb8ix60000bqkbvs4mm51c', 'EXITED', to_timestamp(1779357521338 / 1000.0), to_timestamp(1779357614442 / 1000.0), to_timestamp(1779357808711 / 1000.0), TRUE, 'apple_pay', 50, to_timestamp(1779357521338 / 1000.0), to_timestamp(1779357808713 / 1000.0)),
('cmpfbqcbf000hej422p8psnvc', 'cmpfb8j06000abqkba5iht0cg', 'cmpfb8ix60000bqkbvs4mm51c', 'EXITED', to_timestamp(1779357865947 / 1000.0), to_timestamp(1779357885561 / 1000.0), to_timestamp(1780303896164 / 1000.0), TRUE, 'card', 50, to_timestamp(1779357865947 / 1000.0), to_timestamp(1780303896166 / 1000.0)),
('cmpfbr196000oej42m1ht4zc7', 'cmpfbr18r000lej42rd4opm41', 'cmpfb8ix80006bqkbt15lfr0l', 'EXITED', to_timestamp(1779357898266 / 1000.0), NULL, to_timestamp(1780303895216 / 1000.0), TRUE, NULL, 78835, to_timestamp(1779357898266 / 1000.0), to_timestamp(1780303895217 / 1000.0)),
('cmpfbr26i000uej42tr2fneuw', 'cmpfbr25x000rej428etm4h2j', 'cmpfb8ix80005bqkbqy0dgq1v', 'EXITED', to_timestamp(1779357899466 / 1000.0), NULL, to_timestamp(1780303894272 / 1000.0), TRUE, NULL, 78835, to_timestamp(1779357899466 / 1000.0), to_timestamp(1780303894274 / 1000.0)),
('cmpfbr2vc0010ej42nxknaoef', 'cmpfbr2ux000xej42pzl36pg7', 'cmpfb8ix80004bqkbx7r2443u', 'EXITED', to_timestamp(1779357900360 / 1000.0), NULL, to_timestamp(1780303893288 / 1000.0), TRUE, NULL, 78835, to_timestamp(1779357900360 / 1000.0), to_timestamp(1780303893290 / 1000.0)),
('cmpfbr3fb0016ej42mdh0aybb', 'cmpfbr3ey0013ej42m4loe743', 'cmpfb8ix80003bqkb7ps54cf4', 'EXITED', to_timestamp(1779357901079 / 1000.0), NULL, to_timestamp(1780303892362 / 1000.0), TRUE, NULL, 78835, to_timestamp(1779357901079 / 1000.0), to_timestamp(1780303892363 / 1000.0)),
('cmpfbr6kn001aej42k14mucbi', 'cmpfb8j06000abqkba5iht0cg', 'cmpfb8ix80007bqkbhzh44z92', 'EXITED', to_timestamp(1779357905160 / 1000.0), NULL, to_timestamp(1780303891202 / 1000.0), TRUE, NULL, 78835, to_timestamp(1779357905160 / 1000.0), to_timestamp(1780303891203 / 1000.0)),
('cmpfbr840001eej421jk1bshe', 'cmpfb8j060008bqkb0dnmn2fg', 'cmpfb8ix80002bqkb70zawovm', 'EXITED', to_timestamp(1779357907152 / 1000.0), NULL, to_timestamp(1780303890207 / 1000.0), TRUE, NULL, 78835, to_timestamp(1779357907152 / 1000.0), to_timestamp(1780303890209 / 1000.0));

INSERT INTO "hardware_events" ("id", "type", "payload", "source", "createdAt") VALUES
('cmpfbirij0005ej42oi10xfg2', 'entry_complete', '{"plate":"DEMO-J6XBY","spotCode":"A-1"}', 'admin-demo', to_timestamp(1779357512396 / 1000.0)),
('cmpfbiyf5000bej427prn9l24', 'entry_complete', '{"plate":"DEMO-55SB4","spotCode":"A-2"}', 'admin-demo', to_timestamp(1779357521345 / 1000.0)),
('cmpfbqcc3000iej42eel28949', 'entry_complete', '{"plate":"SZ-808GP","spotCode":"A-2"}', 'simulation', to_timestamp(1779357865971 / 1000.0)),
('cmpfbr19e000pej42ntgvpf1y', 'entry_complete', '{"plate":"DEMO-3LIFJ","spotCode":"A-3"}', 'admin-demo', to_timestamp(1779357898274 / 1000.0)),
('cmpfbr26p000vej42eeqdn3md', 'entry_complete', '{"plate":"DEMO-QAMKX","spotCode":"A-4"}', 'admin-demo', to_timestamp(1779357899473 / 1000.0)),
('cmpfbr2vm0011ej42e0zibvqi', 'entry_complete', '{"plate":"DEMO-0Q1RE","spotCode":"A-5"}', 'admin-demo', to_timestamp(1779357900371 / 1000.0)),
('cmpfbr3fm0017ej422yqkdfp2', 'entry_complete', '{"plate":"DEMO-RYNJQ","spotCode":"A-6"}', 'admin-demo', to_timestamp(1779357901090 / 1000.0)),
('cmpfbr6kw001bej42554emfc1', 'entry_complete', '{"plate":"SZ-808GP","spotCode":"A-7"}', 'simulation', to_timestamp(1779357905168 / 1000.0)),
('cmpfbr848001fej427x1sy9tz', 'entry_complete', '{"plate":"W-123AB","spotCode":"A-8"}', 'simulation', to_timestamp(1779357907160 / 1000.0));

INSERT INTO "event_logs" ("id", "type", "message", "licensePlate", "spotCode", "createdAt") VALUES
('cmpfb8j1j000gbqkbze0oo8dg', 'vehicle_registered', 'W-123AB registered for Anna Berger.', 'W-123AB', NULL, to_timestamp(1779357034855 / 1000.0)),
('cmpfb8j1j000hbqkbz2lyez7r', 'car_entered', 'W-123AB entered and parked at A-1.', 'W-123AB', 'A-1', to_timestamp(1779357034855 / 1000.0)),
('cmpfb8j1j000ibqkbdxajhd6o', 'car_entered', 'KU-77EF entered and parked at A-2.', 'KU-77EF', 'A-2', to_timestamp(1779357034855 / 1000.0)),
('cmpfb8j1j000jbqkbl7w3c44q', 'entry_denied', 'I-404CD denied — vehicle access disabled by admin.', 'I-404CD', NULL, to_timestamp(1779357034855 / 1000.0)),
('cmpfb8j1j000kbqkbf0xaw4qd', 'payment_completed', 'KU-77EF paid €4.50 via card.', 'KU-77EF', 'A-2', to_timestamp(1779357034855 / 1000.0)),
('cmpfbips00000ej42wgponnfa', 'admin_action', 'Demo reset: all sessions closed, all spots freed.', NULL, NULL, to_timestamp(1779357510145 / 1000.0)),
('cmpfbirhy0002ej42nhshlrd8', 'vehicle_registered', 'DEMO-J6XBY auto-registered as guest.', 'DEMO-J6XBY', NULL, to_timestamp(1779357512374 / 1000.0)),
('cmpfbirit0006ej42gs8at66t', 'car_entered', 'DEMO-J6XBY entered and parked at A-1.', 'DEMO-J6XBY', 'A-1', to_timestamp(1779357512405 / 1000.0)),
('cmpfbiyeq0008ej42a6pmo3fc', 'vehicle_registered', 'DEMO-55SB4 auto-registered as guest.', 'DEMO-55SB4', NULL, to_timestamp(1779357521331 / 1000.0)),
('cmpfbiyfa000cej42wmcczxdv', 'car_entered', 'DEMO-55SB4 entered and parked at A-2.', 'DEMO-55SB4', 'A-2', to_timestamp(1779357521351 / 1000.0)),
('cmpfbkyce000dej42a3kr4g3r', 'payment_completed', 'DEMO-55SB4 paid € 0,50 via apple_pay.', 'DEMO-55SB4', 'A-2', to_timestamp(1779357614559 / 1000.0)),
('cmpfbp462000fej42unpb5i56', 'admin_force_exit', 'DEMO-55SB4 force-exited by admin.', 'DEMO-55SB4', 'A-2', to_timestamp(1779357808731 / 1000.0)),
('cmpfbqccp000jej424kkjovfj', 'car_entered', 'SZ-808GP entered and parked at A-2.', 'SZ-808GP', 'A-2', to_timestamp(1779357865994 / 1000.0)),
('cmpfbqrh5000kej425w7wxuyw', 'payment_completed', 'SZ-808GP paid € 0,50 via card.', 'SZ-808GP', 'A-2', to_timestamp(1779357885593 / 1000.0)),
('cmpfbr18x000mej42i3ikimjn', 'vehicle_registered', 'DEMO-3LIFJ auto-registered as guest.', 'DEMO-3LIFJ', NULL, to_timestamp(1779357898258 / 1000.0)),
('cmpfbr19k000qej42retyplfc', 'car_entered', 'DEMO-3LIFJ entered and parked at A-3.', 'DEMO-3LIFJ', 'A-3', to_timestamp(1779357898280 / 1000.0)),
('cmpfbr26b000sej42e2rzgmyn', 'vehicle_registered', 'DEMO-QAMKX auto-registered as guest.', 'DEMO-QAMKX', NULL, to_timestamp(1779357899460 / 1000.0)),
('cmpfbr26u000wej42ho4etvu7', 'car_entered', 'DEMO-QAMKX entered and parked at A-4.', 'DEMO-QAMKX', 'A-4', to_timestamp(1779357899479 / 1000.0)),
('cmpfbr2v3000yej42h8sz59no', 'vehicle_registered', 'DEMO-0Q1RE auto-registered as guest.', 'DEMO-0Q1RE', NULL, to_timestamp(1779357900352 / 1000.0)),
('cmpfbr2vs0012ej42xqz7qi65', 'car_entered', 'DEMO-0Q1RE entered and parked at A-5.', 'DEMO-0Q1RE', 'A-5', to_timestamp(1779357900377 / 1000.0)),
('cmpfbr3f30014ej42ybgq1as0', 'vehicle_registered', 'DEMO-RYNJQ auto-registered as guest.', 'DEMO-RYNJQ', NULL, to_timestamp(1779357901072 / 1000.0)),
('cmpfbr3fr0018ej422l458n4f', 'car_entered', 'DEMO-RYNJQ entered and parked at A-6.', 'DEMO-RYNJQ', 'A-6', to_timestamp(1779357901095 / 1000.0)),
('cmpfbr6l3001cej42qm08n0u9', 'car_entered', 'SZ-808GP entered and parked at A-7.', 'SZ-808GP', 'A-7', to_timestamp(1779357905175 / 1000.0)),
('cmpfbr84e001gej42vfi28cz6', 'car_entered', 'W-123AB entered and parked at A-8.', 'W-123AB', 'A-8', to_timestamp(1779357907167 / 1000.0)),
('cmpuyyxaw0002ejsqeddce30g', 'admin_force_exit', 'W-123AB force-exited by admin.', 'W-123AB', 'A-8', to_timestamp(1780303890194 / 1000.0)),
('cmpuyyxbc0003ejsqblxvkv8j', 'admin_force_exit', 'W-123AB force-exited by admin.', 'W-123AB', 'A-8', to_timestamp(1780303890217 / 1000.0)),
('cmpuyyy2z0005ejsqoi3f0of1', 'admin_force_exit', 'SZ-808GP force-exited by admin.', 'SZ-808GP', 'A-7', to_timestamp(1780303891212 / 1000.0)),
('cmpuyyyzs0007ejsqoucbrfzu', 'admin_force_exit', 'DEMO-RYNJQ force-exited by admin.', 'DEMO-RYNJQ', 'A-6', to_timestamp(1780303892392 / 1000.0)),
('cmpuyyzr40009ejsqjpaienkg', 'admin_force_exit', 'DEMO-0Q1RE force-exited by admin.', 'DEMO-0Q1RE', 'A-5', to_timestamp(1780303893377 / 1000.0)),
('cmpuyz0mo000bejsqlimhas0n', 'admin_force_exit', 'DEMO-QAMKX force-exited by admin.', 'DEMO-QAMKX', 'A-4', to_timestamp(1780303894513 / 1000.0)),
('cmpuyz17c000dejsqc7z8gu3g', 'admin_force_exit', 'DEMO-3LIFJ force-exited by admin.', 'DEMO-3LIFJ', 'A-3', to_timestamp(1780303895256 / 1000.0)),
('cmpuyz1xl000fejsqaj7152hs', 'admin_force_exit', 'SZ-808GP force-exited by admin.', 'SZ-808GP', 'A-2', to_timestamp(1780303896202 / 1000.0)),
('cmpuyz2mq000hejsq8bt1n6li', 'admin_force_exit', 'DEMO-J6XBY force-exited by admin.', 'DEMO-J6XBY', 'A-1', to_timestamp(1780303897106 / 1000.0));

COMMIT;
