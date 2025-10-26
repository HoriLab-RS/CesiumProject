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
    viewer.entities.add({
        name: "九州大学総合研究博物館",
        position: Cesium.Cartesian3.fromDegrees(130.425728, 33.622583, 50),
        point: { 
            pixelSize: 10, 
            color: Cesium.Color.RED, 
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 100.0)
        },
        description: `<h1>九州大学総合研究博物館</h1><p>ボタンでズームインするとピンが見えます。</p>`
    });

    // 7. ボタンイベントリスナー
    var button = document.getElementById("zoomToKyudai");

    if (button) {
        button.addEventListener('click', function() {
            var kyudaiLon = 130.425757; 
            var kyudaiLat = 33.622580;
            var height = 500; // 建物が見える 500m に設定

            zoomToLocation(kyudaiLon, kyudaiLat, height);
        });
    }
}; // window.onload の終了
