// 最終手段: window.onload で、すべてのリソースのロード完了を待ってから実行します
window.onload = function() {

    "use strict";

    // 1. Ion トークンの設定
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiYTEzNmFmYS1hNzA5LTQ2YjQtYTc0OC1iZTg3ODNhOTVlMTIiLCJpZCI6MzQ2ODE0LCJpYXQiOjE3NjE0Njg5Mjh9._9Bw9jDFFjHSKkrklCs3s_zMuPg7q3flgzezAHf7mio';

    // 2. ビューアの初期化とベースマップの有効化
    var viewer = new Cesium.Viewer("cesium", {
        baseLayerPicker: false,
        baseLayer: true, // 衛星画像を背景に描画するために有効化
        selectionIndicator: false, // 緑の選択枠を削除
    });

    // 3. Google Photorealistic 3D Tiles の追加
    viewer.scene.primitives.add(
        new Cesium.Cesium3DTileset({
            url: Cesium.IonResource.fromAssetId(2275207)
        })
    );

    // 4. 初期視点の設定 (指定された座標、20km 上空から福岡市を見る) - 再修正
    viewer.camera.setView({
        // 【修正点 3】初期位置を指定された座標に変更
        destination: Cesium.Cartesian3.fromDegrees(130.360732, 33.565884, 20000),
        orientation: {
            heading: Cesium.Math.toRadians(0.0), // 真北を向く
            pitch: Cesium.Math.toRadians(-85.0), // 少し下向きに見る角度を調整
            roll: 0.0
        }
    });

    // 5. ズームイン処理の関数定義
    function zoomToLocation(lon, lat, height) {
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
            duration: 3 // アニメーション時間（余韻は特に設定しない）
        });
    }

    // 6. Entity（マーカー）の追加 (PinBuilder + scaleByDistance)
    const pinBuilder = new Cesium.PinBuilder();
    const redPin = pinBuilder.fromColor(Cesium.Color.RED, 48).toDataURL(); // デフォルト形状
    const selectedBluePin = pinBuilder.fromColor(Cesium.Color.BLUE, 56).toDataURL(); // デフォルト形状 (選択時)

    viewer.entities.add({
        id: "kyudai-museum-pin",
        name: "九州大学総合研究博物館",
        position: Cesium.Cartesian3.fromDegrees(130.425728, 33.622583, 50),
        billboard: {
            image: redPin,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            scaleByDistance: new Cesium.NearFarScalar(100.0, 1.0, 150.0, 0.0) // 距離でスケール変更
        },
        description: `<h1>九州大学総合研究博物館</h1><p>ここに詳細を載せられます</p>`,
    });

    // ピン選択時のイベントリスナー
    viewer.selectedEntityChanged.addEventListener(function(selectedEntity) {
        viewer.entities.values.forEach(function(entity) {
            if (entity.id === "kyudai-museum-pin" && entity.billboard) {
                entity.billboard.image = redPin;
                entity.billboard.scale = 1.0;
            }
        });
        if (selectedEntity && selectedEntity.id === "kyudai-museum-pin") {
            if (selectedEntity.billboard) {
                selectedEntity.billboard.image = selectedBluePin;
                selectedEntity.billboard.scale = 1.2;
            }
        }
    });

    // 7. ズームボタンイベントリスナー
    var button = document.getElementById("zoomToKyudai");
    if (button) {
        button.addEventListener('click', function() {
            // 【修正点 4】ズームボタンクリック時に三人称視点に戻す
            if (isFirstPersonView) {
                switchToThirdPersonView();
            }
            // ズーム実行
            var kyudaiLon = 130.425757;
            var kyudaiLat = 33.622580;
            var height = 100;
            zoomToLocation(kyudaiLon, kyudaiLat, height);
        });
    }

    // --- 視点切り替え機能 & 一人称視点移動 ---

// 8. 視点モードの状態変数
    let isFirstPersonView = false;

    // 9. 視点切り替えボタン要素
    const toggleViewButton = document.getElementById("toggleView");

    // 10. カメラコントローラー
    const scene = viewer.scene;
    const cameraController = scene.screenSpaceCameraController;

    // 【追加点 1】移動速度を調整可能な定数として定義
    const FIRST_PERSON_MOVE_SPEED = 10.0; // メートル/秒 (この値を変更して速度調整)

    // キーボード入力状態
    const keyFlags = {
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
    };

    // 11. 三人称視点に戻す関数
    function switchToThirdPersonView() {
        isFirstPersonView = false;
        if (toggleViewButton) toggleViewButton.textContent = "視点切替 (三人称)";

        // デフォルトカメラ操作を有効化
        cameraController.enableRotate = true;
        cameraController.enableTranslate = true;
        cameraController.enableZoom = true;
        cameraController.enableTilt = true;
        cameraController.enableLook = true;

        // 【修正点 2-1】マウス操作を Cesium のデフォルトに戻す
        cameraController.rotateEventTypes = Cesium.ScreenSpaceCameraController.DEFAULT_ROTATE_EVENT_TYPES;
        cameraController.translateEventTypes = Cesium.ScreenSpaceCameraController.DEFAULT_TRANSLATE_EVENT_TYPES;
        cameraController.zoomEventTypes = Cesium.ScreenSpaceCameraController.DEFAULT_ZOOM_EVENT_TYPES;
        cameraController.tiltEventTypes = Cesium.ScreenSpaceCameraController.DEFAULT_TILT_EVENT_TYPES;
        cameraController.lookEventTypes = Cesium.ScreenSpaceCameraController.DEFAULT_LOOK_EVENT_TYPES;

        // ... (ループ停止、キーリスナー解除などは変更なし) ...

        // カメラの軸制限とピッチ制限を解除
        viewer.camera.constrainedAxis = undefined;
        cameraController.minimumPitch = Cesium.Math.toRadians(-90.0);
        cameraController.maximumPitch = Cesium.Math.toRadians(90.0);

        // 視野角をデフォルトに戻す
        viewer.camera.frustum.fov = Cesium.Math.toRadians(60.0);
    }

    // 12. 一人称視点に切り替える関数
    function switchToFirstPersonView() {
        isFirstPersonView = true;
        if (toggleViewButton) toggleViewButton.textContent = "視点切替 (一人称)";

        // 【修正点 2-2】一人称視点で不要なマウス操作を完全に無効化
        cameraController.enableRotate = false; // 世界回転は無効
        cameraController.enableTranslate = false; // パン操作は無効
        cameraController.enableZoom = false; // ズームは無効
        cameraController.enableTilt = false; // チルトは無効
        cameraController.enableLook = true; // Look (視点回転) 自体は有効

        // すべてのマウス操作タイプを一旦クリア
        cameraController.rotateEventTypes = undefined;
        cameraController.translateEventTypes = undefined;
        cameraController.zoomEventTypes = undefined;
        cameraController.tiltEventTypes = undefined;

        // Look操作 (視点回転) のみを中ドラッグに割り当て
        // これにより、回転の中心は常にカメラ位置になります
        cameraController.lookEventTypes = [Cesium.CameraEventType.MIDDLE_DRAG];

        // ピッチ（上下の傾き）を制限
        cameraController.minimumPitch = Cesium.Math.toRadians(-20.0);
        cameraController.maximumPitch = Cesium.Math.toRadians(20.0);
        // カメラの上方向をZ軸(地軸)に固定
        viewer.camera.constrainedAxis = Cesium.Cartesian3.UNIT_Z;

        // 視野角を広げる
        viewer.camera.frustum.fov = Cesium.Math.toRadians(90.0);

        // --- 開始座標を固定 (変更なし) ---
        const startLongitude = 130.425408;
        const startLatitude = 33.622125;
        const targetHeight = 45;

        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(startLongitude, startLatitude, targetHeight),
            orientation: { heading: Cesium.Math.toRadians(0.0), pitch: Cesium.Math.toRadians(0.0), roll: 0.0 },
            duration: 0.5
        });

        // キーボードリスナーを設定
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        resetKeyFlags();

        startFirstPersonUpdateLoop();
    }

    // キー入力イベントハンドラ (変更なし)
    function handleKeyDown(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
        const keyCode = event.keyCode;
        if (keyCode === 87 || keyCode === 38) keyFlags.moveForward = true;
        if (keyCode === 83 || keyCode === 40) keyFlags.moveBackward = true;
        if (keyCode === 65 || keyCode === 37) keyFlags.moveLeft = true;
        if (keyCode === 68 || keyCode === 39) keyFlags.moveRight = true;
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

    // 13. 一人称視点用の更新ループ関数 (移動速度の参照を変更)
    let firstPersonUpdateListener = null;
    let lastTime = null;

    function startFirstPersonUpdateLoop() {
        if (firstPersonUpdateListener) firstPersonUpdateListener();
        lastTime = null; // ループ開始時にリセット

        firstPersonUpdateListener = scene.preRender.addEventListener(function(scene, time) {
            if (!isFirstPersonView) return;

            const camera = viewer.camera;
            const now = Cesium.JulianDate.now();
            let elapsed = 0;
            if (lastTime) {
                 elapsed = Cesium.JulianDate.secondsDifference(now, lastTime);
                 if (elapsed <= 0 || elapsed > 0.1) elapsed = 0;
            }
            lastTime = Cesium.JulianDate.clone(now, lastTime);

            // --- カメラ移動処理 ---
            // 【修正点 3】定義した定数を使用
            const moveRate = FIRST_PERSON_MOVE_SPEED * elapsed;

            if (keyFlags.moveForward) camera.moveForward(moveRate);
            if (keyFlags.moveBackward) camera.moveBackward(moveRate);
            if (keyFlags.moveLeft) camera.moveLeft(moveRate);
            if (keyFlags.moveRight) camera.moveRight(moveRate);

            // ロール固定処理 (変更なし)
            if (camera.roll !== 0.0) {
                 camera.setView({
                     orientation: {
                         heading: camera.heading,
                         pitch: camera.pitch,
                         roll: 0.0
                     }
                 });
            }

            // --- 高さ維持処理 ---
            const positionCartographic = Cesium.Cartographic.fromCartesian(camera.position);
            const targetHeight = 45; // 一人称視点の高さ
            
            let terrainHeight = 0;
            const cartographic = Cesium.Cartographic.fromCartesian(camera.position);
            if (viewer.terrainProvider.ready) {
                const promise = Cesium.sampleTerrain(viewer.terrainProvider, 11, [cartographic]);
                Promise.resolve(promise).then(function(updatedCartographics) {
                    if (updatedCartographics && updatedCartographics.length > 0) {
                        if (updatedCartographics[0] && updatedCartographics[0].height !== undefined) {
                            terrainHeight = updatedCartographics[0].height;
                        }
                    }
                    const targetEllipsoidHeight = terrainHeight + targetHeight;
                    if (Math.abs(positionCartographic.height - targetEllipsoidHeight) > 0.1) {
                        camera.position = Cesium.Cartesian3.fromRadians(
                            positionCartographic.longitude,
                            positionCartographic.latitude,
                            targetEllipsoidHeight
                        );
                    }
                }).catch(function(error){
                    console.error("sampleTerrain failed:", error); // 地形取得エラー時のログ
                });
            }
        });
    }

    // 14. 視点切り替えボタンのイベントリスナー (変更なし)
    if (toggleViewButton) {
        toggleViewButton.addEventListener('click', function() {
            if (isFirstPersonView) {
                switchToThirdPersonView();
            } else {
                switchToFirstPersonView();
            }
        });
    }

}; // window.onload の終了