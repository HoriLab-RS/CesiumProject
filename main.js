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
    
    // 4. 初期視点の設定 (20km 上空から福岡市を見る)
    viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(130.36095, 33.56578, 20000), 
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


// 6. Entity（マーカー）の追加
    
    // PinBuilderを使って標準的な赤いピン画像を生成 (Data URI形式)
    const pinBuilder = new Cesium.PinBuilder();
    
    // 【修正点1-1】PinStyle.DOT を削除 (v1.100には存在しないため)
    const redPin = pinBuilder.fromColor(Cesium.Color.RED, 48).toDataURL(); // デフォルト形状のピン
    
    // 【修正点1-2】選択時用のピンも PinStyle.DOT を削除
    const selectedBluePin = pinBuilder.fromColor(Cesium.Color.BLUE, 56).toDataURL(); // デフォルト形状の青いピン

    viewer.entities.add({
        id: "kyudai-museum-pin", 
        name: "九州大学総合研究博物館",
        position: Cesium.Cartesian3.fromDegrees(130.425728, 33.622583, 50),
        
        billboard: { 
            image: redPin, // 【修正点1-3】デフォルト形状のピン画像を使用
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM, 
            scaleByDistance: new Cesium.NearFarScalar(100.0, 1.0, 150.0, 0.0)
        },
        
        description: `<h1>九州大学総合研究博物館</h1><p>ここに詳細を載せられます</p>`,
    });

    // 【修正点2】選択されたEntityが変更されたときのイベントリスナー
    viewer.selectedEntityChanged.addEventListener(function(selectedEntity) {
        // すべてのエンティティのピンをデフォルト（赤）に戻す
        viewer.entities.values.forEach(function(entity) {
            if (entity.id === "kyudai-museum-pin" && entity.billboard) {
                entity.billboard.image = redPin; // 赤いデフォルト形状に戻す
                entity.billboard.scale = 1.0; 
            }
        });

        // 選択されたエンティティがピンであれば、選択時用（青）の画像に切り替える
        if (selectedEntity && selectedEntity.id === "kyudai-museum-pin") {
            if (selectedEntity.billboard) {
                selectedEntity.billboard.image = selectedBluePin; // 青いデフォルト形状に切り替え
                selectedEntity.billboard.scale = 1.2; 
            }
        }
    });



    // 7. ボタンイベントリスナー
    var button = document.getElementById("zoomToKyudai");

    if (button) {
        button.addEventListener('click', function() {
            var kyudaiLon = 130.425757; 
            var kyudaiLat = 33.622580;
            var height = 100;

            zoomToLocation(kyudaiLon, kyudaiLat, height);
        });
    }

    // 8. 視点モードの状態変数 (true: 一人称, false: 三人称)
    let isFirstPersonView = false;
    
    // 9. 視点切り替えボタン要素を取得
    const toggleViewButton = document.getElementById("toggleView");
    
    // 10. カメラコントローラーを取得
    const scene = viewer.scene;
    const cameraController = scene.screenSpaceCameraController;
    
    // 11. 三人称視点に戻す関数
    function switchToThirdPersonView() {
        isFirstPersonView = false;
        toggleViewButton.textContent = "視点切替 (三人称)"; // ボタンテキスト更新
        
        // デフォルトのカメラ操作を有効に戻す
        cameraController.enableRotate = true;
        cameraController.enableTranslate = true;
        cameraController.enableZoom = true;
        cameraController.enableTilt = true;
        cameraController.enableLook = true; // フリーlookを有効化

        // もし一人称視点用の更新ループが動いていたら停止する
        if (firstPersonUpdateListener) {
            firstPersonUpdateListener(); // リスナーを解除
            firstPersonUpdateListener = null;
        }
        
        // カメラのピッチ制限を解除（必要に応じて）
        viewer.camera.constrainedAxis = undefined; 
    }

    // 12. 一人称視点に切り替える関数
    function switchToFirstPersonView() {
        isFirstPersonView = true;
        toggleViewButton.textContent = "視点切替 (一人称)"; // ボタンテキスト更新
        
        // 不要なカメラ操作を無効化（ズームや地表のドラッグ移動など）
        cameraController.enableRotate = false; // 地表ドラッグでの回転を無効化
        cameraController.enableTranslate = false; // 地表ドラッグでの移動を無効化
        cameraController.enableZoom = false; // ホイールでのズームを無効化
        cameraController.enableTilt = false; // チルト（傾け）操作を無効化
        cameraController.enableLook = true; // マウス右ドラッグでの視点回転は有効にする

        // カメラが地面の下に行かないように、また真上/真下を向きすぎないように設定
        // viewer.camera.constrainedAxis = Cesium.Cartesian3.UNIT_Z; // Z軸周りの回転のみ許可 (オプション)

        // 現在のカメラ位置を取得し、高さを1.5mに設定する
        const currentPositionCartographic = Cesium.Cartographic.fromCartesian(viewer.camera.position);
        const targetHeight = 1.5; // 目標の高さ (メートル)
        
        // カメラを指定の高さに移動
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromRadians(
                currentPositionCartographic.longitude,
                currentPositionCartographic.latitude,
                targetHeight // 高度を1.5mに
            ),
            orientation: {
                heading: viewer.camera.heading,
                pitch: Cesium.Math.toRadians(0.0), // 水平視線
                roll: 0.0
            },
            duration: 0.5 // 短いアニメーション
        });
        
        // カメラの高さを常に1.5mに保つための更新ループを開始
        startFirstPersonUpdateLoop();
    }

    // 13. 一人称視点用の更新ループ関数とリスナー解除用変数
    let firstPersonUpdateListener = null; 
    function startFirstPersonUpdateLoop() {
        // 既存のリスナーがあれば解除
        if (firstPersonUpdateListener) {
            firstPersonUpdateListener();
        }

        // preRenderイベントリスナー（描画直前に毎回呼ばれる）
        firstPersonUpdateListener = scene.preRender.addEventListener(function(scene, time) {
            if (!isFirstPersonView) return; // 一人称視点でないなら何もしない

            const camera = viewer.camera;
            const positionCartographic = Cesium.Cartographic.fromCartesian(camera.position);
            const targetHeight = 1.5;

            // 地形データを考慮して現在の地面の高さを取得 (非同期なので注意が必要だが、ここでは簡易的に)
            // もっと正確にするには Cesium.sampleTerrainMostDetailed などを使う
            let terrainHeight = 0;
            const cartographic = Cesium.Cartographic.fromCartesian(camera.position);
            const promise = Cesium.sampleTerrain(viewer.terrainProvider, 11, [cartographic]); // レベル11の地形データで高さを取得
            Promise.resolve(promise).then(function(updatedCartographics) {
                 if (updatedCartographics && updatedCartographics.length > 0) {
                     terrainHeight = updatedCartographics[0].height;
                 }
                 
                 // 地面の高さ + 1.5m にカメラの高さを維持
                 if (Math.abs(positionCartographic.height - (terrainHeight + targetHeight)) > 0.1) { // ずれが大きければ補正
                      camera.position = Cesium.Cartesian3.fromRadians(
                          positionCartographic.longitude,
                          positionCartographic.latitude,
                          terrainHeight + targetHeight
                      );
                 }
            });
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
