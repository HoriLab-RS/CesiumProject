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

    // 4. 初期視点の設定 (福岡市広域 80km) - ユーザー調整済み
    viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(130.45, 33.65, 80000), // ユーザーが調整した座標
        orientation: {
            heading: 0, pitch: -1.4, roll: 0
        }
    });

    // 5. ズームイン処理の関数定義
    function zoomToLocation(lon, lat, height) {
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
            duration: 3
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

    // 【追加点 1】キーボード入力状態を保持するオブジェクト
    const keyFlags = {
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
    };

    // 11. 三人称視点に戻す関数
    function switchToThirdPersonView() {
        isFirstPersonView = false;
        if (toggleViewButton) toggleViewButton.textContent = "視点切替 (三人称)"; // ボタンがあればテキスト更新

        // デフォルトカメラ操作を有効化
        cameraController.enableRotate = true;
        cameraController.enableTranslate = true;
        cameraController.enableZoom = true;
        cameraController.enableTilt = true;
        cameraController.enableLook = true;

        // 【修正点 1-1】マウス操作をデフォルトに戻す
        cameraController.lookEventTypes = [Cesium.CameraEventType.RIGHT_DRAG];
        cameraController.rotateEventTypes = [Cesium.CameraEventType.LEFT_DRAG, Cesium.CameraEventType.MIDDLE_DRAG];

        // 一人称視点ループ停止 & キー入力解除
        if (firstPersonUpdateListener) {
            firstPersonUpdateListener();
            firstPersonUpdateListener = null;
        }
        document.removeEventListener('keydown', handleKeyDown); // キーリスナー解除
        document.removeEventListener('keyup', handleKeyUp);     // キーリスナー解除
        resetKeyFlags(); // キーフラグをリセット

        viewer.camera.constrainedAxis = undefined;
    }

    // 12. 一人称視点に切り替える関数
    function switchToFirstPersonView() {
        isFirstPersonView = true;
        if (toggleViewButton) toggleViewButton.textContent = "視点切替 (一人称)"; // ボタンがあればテキスト更新

        // 不要なカメラ操作を無効化
        cameraController.enableRotate = false; // 世界回転は無効
        cameraController.enableTranslate = false;
        cameraController.enableZoom = false;
        cameraController.enableTilt = false;
        cameraController.enableLook = true; // Look操作自体は有効にする

        // 【修正点 1-2】Look操作 (視点回転) を中ドラッグに割り当て
        cameraController.lookEventTypes = [Cesium.CameraEventType.MIDDLE_DRAG];
        // 【修正点 1-3】Rotate操作から中ドラッグを削除 (Lookと競合するため)
        cameraController.rotateEventTypes = [Cesium.CameraEventType.LEFT_DRAG];

        // --- 開始座標を固定 ---
        const startLongitude = 130.425408;
        const startLatitude = 33.622125;
        // ユーザーが見つけた「イイ感じの高度」に targetHeight を設定してください
        const targetHeight = 50; // 👈 ここを調整した高さに設定

        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(startLongitude, startLatitude, targetHeight),
            orientation: { heading: Cesium.Math.toRadians(0.0), pitch: Cesium.Math.toRadians(0.0), roll: 0.0 },
            duration: 0.5
        });

        // キーボードリスナーを設定
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        resetKeyFlags(); // 開始時にフラグをリセット

        startFirstPersonUpdateLoop(); // 高さ維持＆移動ループ開始
    }

    // 【追加点 2】キー入力イベントハンドラ
    function handleKeyDown(event) {
        // テキスト入力中などは無視
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        const keyCode = event.keyCode;
        if (keyCode === 87 || keyCode === 38) keyFlags.moveForward = true;  // W or Up
        if (keyCode === 83 || keyCode === 40) keyFlags.moveBackward = true; // S or Down
        if (keyCode === 65 || keyCode === 37) keyFlags.moveLeft = true;     // A or Left
        if (keyCode === 68 || keyCode === 39) keyFlags.moveRight = true;    // D or Right
        // デフォルトのスクロールなどを防ぐ (スペースキーなど他のキーも必要なら追加)
        if (keyCode >= 37 && keyCode <= 40) { // Arrow keys
             event.preventDefault();
        }
    }
    function handleKeyUp(event) {
        const keyCode = event.keyCode;
        if (keyCode === 87 || keyCode === 38) keyFlags.moveForward = false; // W or Up
        if (keyCode === 83 || keyCode === 40) keyFlags.moveBackward = false;// S or Down
        if (keyCode === 65 || keyCode === 37) keyFlags.moveLeft = false;    // A or Left
        if (keyCode === 68 || keyCode === 39) keyFlags.moveRight = false;   // D or Right
    }
    function resetKeyFlags() {
        keyFlags.moveForward = false;
        keyFlags.moveBackward = false;
        keyFlags.moveLeft = false;
        keyFlags.moveRight = false;
    }

    // 13. 一人称視点用の更新ループ関数 (高さ維持 + 移動処理)
    let firstPersonUpdateListener = null;
    const moveSpeed = 5.0; // 移動速度 (m/秒) - 好みに応じて調整

    function startFirstPersonUpdateLoop() {
        if (firstPersonUpdateListener) firstPersonUpdateListener();

        firstPersonUpdateListener = scene.preRender.addEventListener(function(scene, time) {
            if (!isFirstPersonView) return;

            const camera = viewer.camera;
            const now = Cesium.JulianDate.now();
            let elapsed = 0;
            // time.previousTime が未定義の場合があるためチェック
            if (time.previousTime) {
                 elapsed = Cesium.JulianDate.secondsDifference(now, time.previousTime);
            }
             // フレーム時間が極端に大きい場合は無視（デバッグ時など）
            if (elapsed > 0.1) elapsed = 0.01;


            // --- カメラ移動処理 ---
            const moveRate = moveSpeed * elapsed; // フレーム時間に基づいた移動距離

            if (keyFlags.moveForward) camera.moveForward(moveRate);
            if (keyFlags.moveBackward) camera.moveBackward(moveRate);
            if (keyFlags.moveLeft) camera.moveLeft(moveRate);
            if (keyFlags.moveRight) camera.moveRight(moveRate);

            // --- 高さ維持処理 (変更なし) ---
            const positionCartographic = Cesium.Cartographic.fromCartesian(camera.position);
             // ユーザーが見つけた「イイ感じの高度」に targetHeight を設定してください
            const targetHeight = 50; // 👈 ここを調整した高さに設定 (switchToFirstPersonView と同じ値)

            let terrainHeight = 0;
            const cartographic = Cesium.Cartographic.fromCartesian(camera.position);
            // 地形サンプリングは非同期でコストがかかるため、頻度を調整するか、
            // よりシンプルな高さ維持方法（例：現在の高さをそのまま使う）も検討可能
            const promise = Cesium.sampleTerrain(viewer.terrainProvider, 11, [cartographic]);
            Promise.resolve(promise).then(function(updatedCartographics) {
                 if (updatedCartographics && updatedCartographics.length > 0) {
                     // sampleTerrain が失敗した場合(水上など) undefined になることがある
                     if (updatedCartographics[0] && updatedCartographics[0].height !== undefined) {
                          terrainHeight = updatedCartographics[0].height;
                     }
                 }
                 const targetEllipsoidHeight = terrainHeight + targetHeight;
                 // 現在の高さと目標高さの差が一定以上ある場合のみ補正
                 if (Math.abs(positionCartographic.height - targetEllipsoidHeight) > 0.1) {
                      camera.position = Cesium.Cartesian3.fromRadians(
                          positionCartographic.longitude,
                          positionCartographic.latitude,
                          targetEllipsoidHeight
                      );
                 }
            });
             // 時間を更新
             time.previousTime = Cesium.JulianDate.clone(now, time.previousTime);

        });
         // previousTime を初期化
         scene.preRender.raiseEvent({ currentTime: Cesium.JulianDate.now(), previousTime: null });
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