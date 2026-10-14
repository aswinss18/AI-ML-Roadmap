DROP TABLE IF EXISTS mobiles;

CREATE TABLE mobiles (
    id SERIAL PRIMARY KEY,

    brand VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,

    price INT NOT NULL,
    ram INT NOT NULL,
    storage INT NOT NULL,

    processor VARCHAR(100),
    operating_system VARCHAR(50),

    screen_size DECIMAL(3,1),
    refresh_rate INT,

    battery_capacity INT,
    charging_watt INT,

    rear_camera_mp INT,
    front_camera_mp INT,

    supports_5g BOOLEAN,
    dual_sim BOOLEAN,

    color VARCHAR(50),

    rating DECIMAL(2,1),
    stock_quantity INT,

    release_year INT
);


INSERT INTO mobiles (
    brand,
    model_name,
    price,
    ram,
    storage,
    processor,
    operating_system,
    screen_size,
    refresh_rate,
    battery_capacity,
    charging_watt,
    rear_camera_mp,
    front_camera_mp,
    supports_5g,
    dual_sim,
    color,
    rating,
    stock_quantity,
    release_year
)
VALUES

('Apple', 'iPhone 15', 69900, 6, 128,
 'Apple A16 Bionic', 'iOS',
 6.1, 60, 3349, 20,
 48, 12,
 TRUE, TRUE,
 'Black', 4.6, 25, 2023),

('Apple', 'iPhone 15 Pro', 129900, 8, 256,
 'Apple A17 Pro', 'iOS',
 6.1, 120, 3274, 27,
 48, 12,
 TRUE, TRUE,
 'Natural Titanium', 4.7, 12, 2023),

('Apple', 'iPhone 15 Pro Max', 154900, 8, 256,
 'Apple A17 Pro', 'iOS',
 6.7, 120, 4441, 27,
 48, 12,
 TRUE, TRUE,
 'Blue Titanium', 4.8, 8, 2023),

('Samsung', 'Galaxy S24', 74999, 8, 256,
 'Exynos 2400', 'Android',
 6.2, 120, 4000, 25,
 50, 12,
 TRUE, TRUE,
 'Onyx Black', 4.5, 31, 2024),

('Samsung', 'Galaxy S24 Ultra', 129999, 12, 256,
 'Snapdragon 8 Gen 3', 'Android',
 6.8, 120, 5000, 45,
 200, 12,
 TRUE, TRUE,
 'Titanium Gray', 4.8, 18, 2024),

('Samsung', 'Galaxy A55', 39999, 8, 256,
 'Exynos 1480', 'Android',
 6.6, 120, 5000, 25,
 50, 32,
 TRUE, TRUE,
 'Awesome Navy', 4.4, 45, 2024),

('OnePlus', 'OnePlus 12', 64999, 12, 256,
 'Snapdragon 8 Gen 3', 'Android',
 6.8, 120, 5400, 100,
 50, 32,
 TRUE, TRUE,
 'Flowy Emerald', 4.6, 35, 2024),

('OnePlus', 'OnePlus 12R', 39999, 8, 128,
 'Snapdragon 8 Gen 2', 'Android',
 6.8, 120, 5500, 100,
 50, 16,
 TRUE, TRUE,
 'Cool Blue', 4.5, 52, 2024),

('OnePlus', 'Nord CE 4', 24999, 8, 128,
 'Snapdragon 7 Gen 3', 'Android',
 6.7, 120, 5500, 100,
 50, 16,
 TRUE, TRUE,
 'Dark Chrome', 4.4, 67, 2024),

('Xiaomi', 'Xiaomi 14', 69999, 12, 512,
 'Snapdragon 8 Gen 3', 'Android',
 6.4, 120, 4610, 90,
 50, 32,
 TRUE, TRUE,
 'Jade Green', 4.5, 22, 2024),

('Xiaomi', 'Redmi Note 13 Pro', 25999, 8, 256,
 'Snapdragon 7s Gen 2', 'Android',
 6.7, 120, 5100, 67,
 200, 16,
 TRUE, TRUE,
 'Midnight Black', 4.4, 74, 2024),

('Xiaomi', 'Redmi Note 13', 17999, 6, 128,
 'MediaTek Dimensity 6080', 'Android',
 6.7, 120, 5000, 33,
 108, 16,
 TRUE, TRUE,
 'Prism Gold', 4.2, 90, 2024),

('Vivo', 'Vivo X100 Pro', 89999, 16, 512,
 'MediaTek Dimensity 9300', 'Android',
 6.8, 120, 5400, 100,
 50, 32,
 TRUE, TRUE,
 'Asteroid Black', 4.6, 17, 2024),

('Vivo', 'Vivo V30 Pro', 41999, 12, 256,
 'MediaTek Dimensity 8200', 'Android',
 6.8, 120, 5000, 80,
 50, 50,
 TRUE, TRUE,
 'Andaman Blue', 4.4, 39, 2024),

('IQOO', 'iQOO 12', 52999, 12, 256,
 'Snapdragon 8 Gen 3', 'Android',
 6.8, 144, 5000, 120,
 50, 16,
 TRUE, TRUE,
 'Legend White', 4.6, 28, 2024),

('IQOO', 'iQOO Neo 9 Pro', 36999, 8, 128,
 'Snapdragon 8 Gen 2', 'Android',
 6.8, 144, 5160, 120,
 50, 16,
 TRUE, TRUE,
 'Fiery Red', 4.5, 43, 2024),

('Google', 'Pixel 8', 75999, 8, 128,
 'Google Tensor G3', 'Android',
 6.2, 120, 4575, 27,
 50, 11,
 TRUE, TRUE,
 'Obsidian', 4.4, 21, 2023),

('Google', 'Pixel 8 Pro', 106999, 12, 128,
 'Google Tensor G3', 'Android',
 6.7, 120, 5050, 30,
 50, 11,
 TRUE, TRUE,
 'Bay Blue', 4.5, 14, 2023),

('Nothing', 'Phone 2', 39999, 12, 256,
 'Snapdragon 8+ Gen 1', 'Android',
 6.7, 120, 4700, 45,
 50, 32,
 TRUE, TRUE,
 'White', 4.4, 36, 2023),

('Nothing', 'Phone 2a', 23999, 8, 128,
 'MediaTek Dimensity 7200 Pro', 'Android',
 6.7, 120, 5000, 45,
 50, 32,
 TRUE, TRUE,
 'Milk', 4.3, 64, 2024),

('Motorola', 'Edge 50 Pro', 31999, 8, 256,
 'Snapdragon 7 Gen 3', 'Android',
 6.7, 144, 4500, 125,
 50, 50,
 TRUE, TRUE,
 'Luxe Lavender', 4.4, 48, 2024),

('Motorola', 'Moto G64', 14999, 8, 128,
 'MediaTek Dimensity 7025', 'Android',
 6.5, 120, 6000, 33,
 50, 16,
 TRUE, TRUE,
 'Mint Green', 4.2, 83, 2024),

('Realme', 'Realme GT 6', 40999, 12, 256,
 'Snapdragon 8s Gen 3', 'Android',
 6.8, 120, 5500, 120,
 50, 32,
 TRUE, TRUE,
 'Fluid Silver', 4.5, 41, 2024),

('Realme', 'Realme 12 Pro Plus', 29999, 8, 256,
 'Snapdragon 7s Gen 2', 'Android',
 6.7, 120, 5000, 67,
 50, 32,
 TRUE, TRUE,
 'Submarine Blue', 4.3, 56, 2024),

('Oppo', 'Reno 11 Pro', 39999, 12, 256,
 'MediaTek Dimensity 8200', 'Android',
 6.7, 120, 4600, 80,
 50, 32,
 TRUE, TRUE,
 'Pearl White', 4.4, 33, 2024);