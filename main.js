// 最終手段: window.onload で、すべてのリソースのロード完了を待ってから実行します
window.onload = function() {

    "use strict";

    // 1. Ion トークンの設定
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiYTEzNmFmYS1hNzA5LTQ2YjQtYTc0OC1iZTg3ODNhOTVlMTIiLCJpZCI6MzQ2ODE0LCJpYXQiOjE3NjE0Njg5Mjh9._9Bw9jDFFjHSKkrklCs3s_zMuPg7q3flgzezAHf7mio';

    // 2. ビューアの初期化とベースマップの有効化
    var viewer = new Cesium.Viewer("cesium", {
        baseLayerPicker: false,
        baseLayer: true // 衛星画像を背景に描画するために有効化
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
    
    // 【修正点1-1】丸いピンの画像を生成 (赤色)
    const redCirclePin = pinBuilder.fromColor(Cesium.Color.RED, 48, Cesium.PinBuilder.PinStyle.DOT).toDataURL(); // PinStyle.DOT で丸に
    
    // 【修正点1-2】クリック時に表示する二重丸のピン画像を生成 (青色で少し大きく)
    const selectedBlueCirclePin = pinBuilder.fromColor(Cesium.Color.BLUE, 56, Cesium.PinBuilder.PinStyle.DOT).toDataURL(); // 選択時用の青いピン

    viewer.entities.add({
        id: "kyudai-museum-pin", // 【追加点】ピンに一意のIDを設定
        name: "九州大学総合研究博物館",
        position: Cesium.Cartesian3.fromDegrees(130.425728, 33.622583, 50),
        
        billboard: { 
            image: redCirclePin, // 【修正点1-3】丸いピン画像を使用
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM, 
            scaleByDistance: new Cesium.NearFarScalar(100.0, 1.0, 150.0, 0.0)
        },
        
        description: `<h1>九州大学総合研究博物館</h1><p>ここに詳細を載せられます</p>`,
    });

    // 【追加点2】選択されたEntityが変更されたときのイベントリスナー
    viewer.selectedEntityChanged.addEventListener(function(selectedEntity) {
        // すべてのエンティティのピンをデフォルト（赤丸）に戻す
        viewer.entities.values.forEach(function(entity) {
            if (entity.id === "kyudai-museum-pin" && entity.billboard) {
                entity.billboard.image = redCirclePin;
                entity.billboard.scale = 1.0; // 選択解除でスケールを元に戻す
            }
        });

        // 選択されたエンティティが「九州大学総合研究博物館」のピンであれば、二重丸の画像に切り替える
        if (selectedEntity && selectedEntity.id === "kyudai-museum-pin") {
            if (selectedEntity.billboard) {
                selectedEntity.billboard.image = selectedBlueCirclePin; // 青い二重丸に切り替え
                selectedEntity.billboard.scale = 1.2; // 少し大きくする
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
}; // window.onload の終了
