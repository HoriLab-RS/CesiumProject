// window.onload で、すべてのリソースのロード完了を待ってから実行します
window.onload = function() {

    "use strict";

    // 1. Cesium Ion トークンの設定
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiYTEzNmFmYS1hNzA5LTQ2YjQtYTc0OC1iZTg3ODNhOTVlMTIiLCJpZCI6MzQ2ODE0LCJpYXQiOjE3NjE0Njg5Mjh9._9Bw9jDFFjHSKkrklCs3s_zMuPg7q3flgzezAHf7mio';

    // 2. ビューアの初期化
    var viewer = new Cesium.Viewer("cesium", {
        baseLayerPicker: false, // ベースレイヤー選択ウィジェット非表示
        baseLayer: true,        // デフォルトの衛星画像を表示
        selectionIndicator: false // クリック時の選択インジケーター(緑枠)非表示
    });

    // 3. Google Photorealistic 3D Tiles の追加
    viewer.scene.primitives.add(
        new Cesium.Cesium3DTileset({
            url: Cesium.IonResource.fromAssetId(2275207) // Google 3D TilesのアセットID
        })
    );

    // 4. 初期カメラ視点の設定 (福岡市上空 20km)
    viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(130.360732, 33.565884, 20000), // 経度, 緯度, 高度(m)
        orientation: {
            heading: Cesium.Math.toRadians(0.0),   // 北向き
            pitch: Cesium.Math.toRadians(-85.0), // ほぼ真下を見る角度
            roll: 0.0                            // 水平
        }
    });

    // 5. 指定地点へズームする関数
    function zoomToLocation(lon, lat, height) {
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
            duration: 3 // 3秒かけて移動
        });
    }

    // 6. 九州大学博物館マーカー(Entity)の追加
    const pinBuilder = new Cesium.PinBuilder();
    const redPin = pinBuilder.fromColor(Cesium.Color.RED, 48).toDataURL(); // 通常時のピン (赤)
    const selectedBluePin = pinBuilder.fromColor(Cesium.Color.BLUE, 56).toDataURL(); // 選択時のピン (青・少し大きい)

    viewer.entities.add({
        id: "kyudai-museum-pin", // Entityの識別ID
        name: "九州大学総合研究博物館", // 情報ウィンドウのタイトル
        position: Cesium.Cartesian3.fromDegrees(130.425728, 33.622583, 50), // ピンの座標 (経度, 緯度, 地面からの高さ)
        billboard: { // 画像としてピンを表示
            image: redPin, // 通常時の画像
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // ピンの底辺を座標に合わせる
            scaleByDistance: new Cesium.NearFarScalar(100.0, 1.0, 150.0, 0.0) // 100m以内なら通常サイズ、150m以上なら消える
        },
        description: `<h1>九州大学総合研究博物館</h1><p>ここに詳細を載せられます</p>` // クリック時に表示されるHTML
    });

    // 6.1 マーカー選択時の処理 (色とサイズを変更)
    viewer.selectedEntityChanged.addEventListener(function(selectedEntity) {
        // まず、すべての博物館ピンを通常状態(赤)に戻す
        viewer.entities.values.forEach(function(entity) {
            if (entity.id === "kyudai-museum-pin" && entity.billboard) {
                entity.billboard.image = redPin;
                entity.billboard.scale = 1.0; // サイズも元に戻す
            }
        });
        // 選択されたのが博物館ピンなら、選択状態(青・大きい)にする
        if (selectedEntity && selectedEntity.id === "kyudai-museum-pin") {
            if (selectedEntity.billboard) {
                selectedEntity.billboard.image = selectedBluePin;
                selectedEntity.billboard.scale = 1.2; // 少し大きくする
            }
        }
    });

    // 7. 「九州大学博物館へズーム」ボタンの処理
    var zoomButton = document.getElementById("zoomToKyudai");
    if (zoomButton) {
        zoomButton.addEventListener('click', function() {
            // もし一人称視点中なら、三人称視点に戻す
            if (isFirstPersonView) {
                switchToThirdPersonView();
            }
            // 博物館へズーム
            zoomToLocation(130.425757, 33.622580, 100); // 経度, 緯度, 高度
        });
    }

    // --- 視点切り替え機能 & 一人称視点移動 ---

    // 8. 視点モードの状態管理
    let isFirstPersonView = false; // 現在が一人称視点かどうか

    // 9. 視点切り替えボタン
    const toggleViewButton = document.getElementById("toggleView");

    // 10. カメラ制御関連の変数
    const scene = viewer.scene;
    const cameraController = scene.screenSpaceCameraController;
    const FIRST_PERSON_MOVE_SPEED = 10.0; // 一人称視点での移動速度 (m/秒)
    const keyFlags = { // 押されているキーの状態
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
    };

    // 11. 三人称視点に戻す関数
    function switchToThirdPersonView() {
        isFirstPersonView = false;
        if (toggleViewButton) toggleViewButton.textContent = "視点切替 (三人称)";

        // カメラ操作をデフォルトに戻す
        cameraController.enableRotate = true;
        cameraController.enableTranslate = true;
        cameraController.enableZoom = true;
        cameraController.enableTilt = true;
        cameraController.enableLook = true;
        cameraController.rotateEventTypes = Cesium.ScreenSpaceCameraController.DEFAULT_ROTATE_EVENT_TYPES;
        cameraController.translateEventTypes = Cesium.ScreenSpaceCameraController.DEFAULT_TRANSLATE_EVENT_TYPES;
        cameraController.zoomEventTypes = Cesium.ScreenSpaceCameraController.DEFAULT_ZOOM_EVENT_TYPES;
        cameraController.tiltEventTypes = Cesium.ScreenSpaceCameraController.DEFAULT_TILT_EVENT_TYPES;
        cameraController.lookEventTypes = Cesium.ScreenSpaceCameraController.DEFAULT_LOOK_EVENT_TYPES;

        // 一人称視点用のループとキーリスナーを停止・解除
        if (firstPersonUpdateListener) {
            firstPersonUpdateListener();
            firstPersonUpdateListener = null;
        }
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        resetKeyFlags();

        // カメラの制約を解除
        viewer.camera.constrainedAxis = undefined;
        cameraController.minimumPitch = Cesium.Math.toRadians(-90.0);
        cameraController.maximumPitch = Cesium.Math.toRadians(90.0);

        // 視野角をデフォルト(60度)に戻す
        viewer.camera.frustum.fov = Cesium.Math.toRadians(60.0);
    }

    // 12. 一人称視点に切り替える関数
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
        // 視点回転(Look)を中ボタンドラッグに割り当て
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
        const startHeight = 41; // 開始時の海抜高さ (ループで地面からの高さに補正される)

        // 指定座標へ移動
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
    }

    // 12.1 キーボード入力の処理
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

    // 13. 一人称視点用の更新ループ (移動、高さ維持、ロール固定)
    let firstPersonUpdateListener = null; // ループ解除用
    let lastTime = null; // 前フレームの時刻
    function startFirstPersonUpdateLoop() {
        // 古いループがあれば解除
        if (firstPersonUpdateListener) firstPersonUpdateListener();
        lastTime = null; // 時間をリセット

        // preRender: 各フレーム描画直前に実行されるイベント
        firstPersonUpdateListener = scene.preRender.addEventListener(function(scene, time) {
            // 一人称視点モードでなければ何もしない
            if (!isFirstPersonView) return;

            const camera = viewer.camera;
            const now = Cesium.JulianDate.now();
            let elapsed = 0; // 経過時間(秒)

            // 経過時間を計算 (初回フレームは除く)
            if (lastTime) {
                elapsed = Cesium.JulianDate.secondsDifference(now, lastTime);
                // 経過時間が異常な値の場合は0にする (PCがスリープした場合など)
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

            // 地面からの高さを維持する処理
            const positionCartographic = Cesium.Cartographic.fromCartesian(camera.position); // 現在のカメラ位置(緯度経度高度)
            const targetHeightAboveGround = 41; // 地面からの目標高さ (41m)
            let terrainHeight = 0; // 地面の高さ(海抜)
            const cartographic = Cesium.Cartographic.fromCartesian(camera.position); // カメラ真下の座標

            // 地形プロバイダーが準備できていれば、地面の高さを取得
            if (viewer.terrainProvider.ready) {
                const promise = Cesium.sampleTerrain(viewer.terrainProvider, 11, [cartographic]); // レベル11の精度で取得
                Promise.resolve(promise).then(function(updatedCartographics) {
                    // 地形データが取得できたら高さを更新
                    if (updatedCartographics && updatedCartographics.length > 0) {
                        if (updatedCartographics[0] && updatedCartographics[0].height !== undefined) {
                            terrainHeight = updatedCartographics[0].height;
                        }
                    }
                    // 目標とする海抜高度 = 地面の高さ + 目標の地上高
                    const targetEllipsoidHeight = terrainHeight + targetHeightAboveGround;
                    // 現在の高さと目標の高さが 0.1m 以上ずれていたら補正
                    if (Math.abs(positionCartographic.height - targetEllipsoidHeight) > 0.04) {
                        camera.position = Cesium.Cartesian3.fromRadians(
                            positionCartographic.longitude,
                            positionCartographic.latitude,
                            targetEllipsoidHeight
                        );
                    }
                }).catch(function(error){
                    // 地形データの取得に失敗した場合のエラーログ (通常は無視してOK)
                    // console.error("sampleTerrain failed:", error);
                });
            }
        });
    }

    // 14. 視点切り替えボタンのイベントリスナー
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