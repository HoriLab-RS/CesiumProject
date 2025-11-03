// window.onload で、すべてのリソースのロード完了を待ってから実行します
(async function() {
    "use strict";

    // ===== 1. 変数宣言ゾーン =====
    // ※このトークンが2767062へのアクセス権限を持っているか確認してください
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiYTEzNmFmYS1hNzA5LTQ2YjQtYTc0OC1iZTg3ODNhOTVlMTIiLCJpZCI6MzQ2ODE0LCJpYXQiOjE3NjE0Njg5Mjh9._9Bw9jDFFjHSKkrklCs3s_zMuPg7q3flgzezAHf7mio'; // ← 必要に応じて書き換え

    let viewer;
    let scene, cameraController;
    let isFirstPersonView = false;
    let toggleViewButton;
    let zoomButton;
    const FIRST_PERSON_MOVE_SPEED = 10.0;
    const keyFlags = { moveForward: false, moveBackward: false, moveLeft: false, moveRight: false };
    let redPin, selectedBluePin;
    let buildingTileset;

    // 一人称視点ループ制御用の変数
    let firstPersonUpdateListener = null; // ループ解除用
    let lastTime = null; // 前フレームの時刻

    // ===== 2. 汎用関数 =====
    function zoomToLocation(lon, lat, height) {
        if (Cesium.defined(viewer)) {
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
                duration: 3
            });
        }
    }

    // ===== 3. キーボード入力の処理 =====
    function handleKeyDown(event) {
        // テキスト入力中は操作しない
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
        const keyCode = event.keyCode;
        if (keyCode === 87 || keyCode === 38) keyFlags.moveForward = true;  // W or ↑
        if (keyCode === 83 || keyCode === 40) keyFlags.moveBackward = true; // S or ↓
        if (keyCode === 65 || keyCode === 37) keyFlags.moveLeft = true;     // A or ←
        if (keyCode === 68 || keyCode === 39) keyFlags.moveRight = true;    // D or →
        // 矢印キーでのページスクロールを無効化
        if (keyCode >= 37 && keyCode <= 40) event.preventDefault();
    }
    function handleKeyUp(event) {
        const keyCode = event.keyCode;
        if (keyCode === 87 || keyCode === 38) keyFlags.moveForward = false;
        if (keyCode === 83 || keyCode === 40) keyFlags.moveBackward = false;
        if (keyCode === 65 || keyCode === 37) keyFlags.moveLeft = false;
        if (keyCode === 68 || keyCode === 39) keyFlags.moveRight = false;
    }
    function resetKeyFlags() {
        keyFlags.moveForward = false;
        keyFlags.moveBackward = false;
        keyFlags.moveLeft = false;
        keyFlags.moveRight = false;
    }

    // ===== 4. 一人称視点用の更新ループ (高さ固定ロジック含む) =====
    function startFirstPersonUpdateLoop() {
        // 古いループがあれば解除
        if (firstPersonUpdateListener) firstPersonUpdateListener();
        lastTime = null; // 時間をリセット

        // 一人称視点の目標高度 (Ellipse Height)
        const TARGET_ELLIPSOID_HEIGHT = 40.0;

        // preRender: 各フレーム描画直前に実行されるイベント
        firstPersonUpdateListener = scene.preRender.addEventListener(function(scene, time) {
            // 一人称視点モードでなければ何もしない
            if (!isFirstPersonView) return;

            const camera = viewer.camera;
            const now = Cesium.JulianDate.now();
            let elapsed = 0; // 経過時間(秒)

            // 経過時間を計算
            if (lastTime) {
                elapsed = Cesium.JulianDate.secondsDifference(now, lastTime);
                if (elapsed <= 0 || elapsed > 0.1) elapsed = 0;
            }
            lastTime = Cesium.JulianDate.clone(now, lastTime); // 現在時刻を保存

            // カメラ移動処理 (速度 * 時間 = 距離)
            const moveRate = FIRST_PERSON_MOVE_SPEED * elapsed;
            if (keyFlags.moveForward) camera.moveForward(moveRate);
            if (keyFlags.moveBackward) camera.moveBackward(moveRate);
            if (keyFlags.moveLeft) camera.moveLeft(moveRate);
            if (keyFlags.moveRight) camera.moveRight(moveRate);

            // ロール(横傾き)を常に0に固定
            if (camera.roll !== 0.0) {
                camera.setView({
                    orientation: {
                        heading: camera.heading,
                        pitch: camera.pitch,
                        roll: 0.0
                    }
                });
            }

            // 【高さ固定処理: 楕円体高を強制固定】
            const positionCartographic = Cesium.Cartographic.fromCartesian(camera.position); 

            // 現在の高度が目標値と大きく異なっていれば、高度を強制補正する
            if (Math.abs(positionCartographic.height - TARGET_ELLIPSOID_HEIGHT) > 0.04) {
                 camera.position = Cesium.Cartesian3.fromRadians(
                     positionCartographic.longitude,
                     positionCartographic.latitude,
                     TARGET_ELLIPSOID_HEIGHT
                 );
             }
        });
    }

    // ===== 5. 視点切替関数 =====
    
    // 5.1 三人称視点に切り替える関数
    function switchToThirdPersonView() { 
        isFirstPersonView = false;
        if (toggleViewButton) toggleViewButton.textContent = "視点切替 (三人称)";

        // カメラ制御を三人称モードに戻す
        cameraController.enableRotate = true;
        cameraController.enableTranslate = true;
        cameraController.enableZoom = true;
        cameraController.enableTilt = true;
        cameraController.enableLook = true;
        
        // 【修正点: 中ドラッグをTranslate（平行移動/パン）に戻す】
        cameraController.rotateEventTypes = [Cesium.CameraEventType.LEFT_DRAG];
        cameraController.zoomEventTypes = [Cesium.CameraEventType.RIGHT_DRAG, Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH];
        cameraController.translateEventTypes = [Cesium.CameraEventType.MIDDLE_DRAG]; // ここを修正
        cameraController.lookEventTypes = undefined; 

        // ループとキーボード操作を終了
        if (firstPersonUpdateListener) {
            firstPersonUpdateListener();
            firstPersonUpdateListener = null;
        }
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        resetKeyFlags();
        
        // カメラの制限を解除
        viewer.camera.constrainedAxis = undefined;
        
        // UIを切り替え
        document.getElementById('third-person-controls').style.display = 'block';
        document.getElementById('first-person-controls').style.display = 'none';
    }
    
    // 5.2 一人称視点に切り替える関数
    function switchToFirstPersonView() {
        isFirstPersonView = true;
        if (toggleViewButton) toggleViewButton.textContent = "視点切替 (一人称)";

        // 三人称視点用のカメラ操作を無効化
        cameraController.enableRotate = false;
        cameraController.enableTranslate = false;
        cameraController.enableZoom = false;
        cameraController.enableTilt = false;
        cameraController.enableLook = true; // 視点回転(Look)のみ有効

        // 不要なマウスイベントタイプをクリア
        cameraController.rotateEventTypes = undefined;
        cameraController.translateEventTypes = undefined;
        cameraController.zoomEventTypes = undefined;
        cameraController.tiltEventTypes = undefined;
        // 視点回転(Look)を中ボタンドラッグに割り当て (一人称視点の設定)
        cameraController.lookEventTypes = [Cesium.CameraEventType.MIDDLE_DRAG]; 

        // カメラの上下の傾き(ピッチ)を制限
        cameraController.minimumPitch = Cesium.Math.toRadians(-20.0);
        cameraController.maximumPitch = Cesium.Math.toRadians(20.0);
        // カメラの横の傾き(ロール)を防ぐため、上方向をZ軸に固定
        viewer.camera.constrainedAxis = Cesium.Cartesian3.UNIT_Z;

        // 視野角を広げる (90度)
        viewer.camera.frustum.fov = Cesium.Math.toRadians(90.0);

        // 一人称視点の開始座標と初期高さ 
        const startLongitude = 130.425408;
        const startLatitude = 33.622125;
        const startHeight = 40; 

        // 指定座標へ移動 (フライ)
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(startLongitude, startLatitude, startHeight),
            orientation: { // 最初は真北・水平を向く
                heading: Cesium.Math.toRadians(0.0),
                pitch: Cesium.Math.toRadians(0.0),
                roll: 0.0
            },
            duration: 0.5 // 0.5秒で移動
        });

        // キーボード操作の受付を開始
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        resetKeyFlags(); // 開始時にキー状態をリセット

        // 高さ維持と移動のためのループを開始
        startFirstPersonUpdateLoop();

        // UIを切り替え
        document.getElementById('third-person-controls').style.display = 'none';
        document.getElementById('first-person-controls').style.display = 'block';
    }


    // ===== 6. 実行コード =====
    try {
        
        // 【ローディングオーバーレイの取得】
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            // ロード開始時、オーバーレイを不透明にする
            loadingOverlay.style.opacity = '1';
        }
        
        // 【地形プロバイダーの非同期ロード】
        const japanTerrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(2767062);
        
        viewer = new Cesium.Viewer("cesium", {
            baseLayerPicker: false,
            selectionIndicator: false,
            terrainProvider: japanTerrainProvider, 
        });

        scene = viewer.scene;
        cameraController = scene.screenSpaceCameraController;

        // 【初期設定: 三人称視点の標準マウスイベント設定】
        cameraController.rotateEventTypes = [Cesium.CameraEventType.LEFT_DRAG];
        cameraController.zoomEventTypes = [Cesium.CameraEventType.RIGHT_DRAG, Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH];
        cameraController.translateEventTypes = [Cesium.CameraEventType.MIDDLE_DRAG];
        cameraController.lookEventTypes = undefined;

        toggleViewButton = document.getElementById("toggleView");
        zoomButton = document.getElementById("zoomToKyudai");
        const pinBuilder = new Cesium.PinBuilder();
        redPin = pinBuilder.fromColor(Cesium.Color.RED, 48).toDataURL();
        selectedBluePin = pinBuilder.fromColor(Cesium.Color.BLUE, 56).toDataURL();

        console.log("Cesium Viewer の設定が完了しました。");

        // ===== 3Dタイル読み込み (非同期) =====
        const BLD_FOLDER_NAME = '40130_fukuoka-shi_city_2024_citygml_1_op_bldg_3dtiles_40131_higashi-ku_lod2';
        const buildingTilesetURL = `plateau_3dtiles/${BLD_FOLDER_NAME}/tileset.json`;

        buildingTileset = await Cesium.Cesium3DTileset.fromUrl(buildingTilesetURL, {
            maximumScreenSpaceError: 2,
        });

        viewer.scene.primitives.add(buildingTileset);
        buildingTileset.modelMatrix = Cesium.Matrix4.IDENTITY;

        console.log("建物タイルセットがロードされました。");

        // 【初期位置へのフライ】
        const lon_center = 130.41;
        const lat_center = 33.62;
        const startLongitude = 130.425408;
        const startLatitude = 33.622125;
        const startHeight = 40; 
        
        await viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lon_center, lat_center, 5000),
            duration: 4,
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        await viewer.zoomTo(buildingTileset);
        console.log("ズーム完了");
        
        // ズーム完了後、一人称の初期位置へカメラを移動させる (この時点ではまだ三人称モード)
        viewer.camera.setView({
             destination: Cesium.Cartesian3.fromDegrees(startLongitude, startLatitude, startHeight),
             orientation: {
                heading: Cesium.Math.toRadians(0.0), // 北向き
                pitch: Cesium.Math.toRadians(0.0),
                roll: 0.0
            }
        });


        // 7. 九州大学博物館マーカー
        viewer.entities.add({
            id: "kyudai-museum-pin",
            name: "九州大学総合研究博物館",
            position: Cesium.Cartesian3.fromDegrees(130.425728, 33.622583, 50),
            billboard: {
                image: redPin,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                scaleByDistance: new Cesium.NearFarScalar(100.0, 1.0, 150.0, 0.0)
            },
            description: `<h1>九州大学総合研究博物館</h1><p>ここに詳細を載せられます</p>`
        });

        // マーカー選択時の色変更
        viewer.selectedEntityChanged.addEventListener(selectedEntity => {
            viewer.entities.values.forEach(entity => {
                if (entity.id === "kyudai-museum-pin" && entity.billboard) {
                    entity.billboard.image = redPin;
                    entity.billboard.scale = 1.0;
                }
            });
            if (selectedEntity && selectedEntity.id === "kyudai-museum-pin" && selectedEntity.billboard) {
                selectedEntity.billboard.image = selectedBluePin;
                selectedEntity.billboard.scale = 1.2;
            }
        });

        // ボタン処理
        if (zoomButton) {
            zoomButton.addEventListener('click', () => {
                if (isFirstPersonView) switchToThirdPersonView();
                zoomToLocation(130.425757, 33.622580, 100);
            });
        }

        if (toggleViewButton) {
            toggleViewButton.addEventListener('click', () => {
                if (isFirstPersonView) switchToThirdPersonView();
                else switchToFirstPersonView();
            });
        }

        // =======================================================
        // 【ローディング完了処理】
        // =======================================================
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500); 
        }

    } catch (error) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        console.error("致命的なエラーが発生しました:", error);
    }
})();