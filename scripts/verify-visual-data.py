"""Check bundled vector dimensions, species coverage and finite unit normalization."""
import json,pathlib,sys,numpy as np
root=pathlib.Path(sys.argv[1])
for prefix in ['visual-labels','visual-art']:
 labels=json.loads((root/(prefix+'.json')).read_text());vectors=np.fromfile(root/(prefix+'.f32'),dtype=np.float32).reshape(-1,512)
 assert len(vectors)==len(labels)
 assert np.isfinite(vectors).all()
 assert np.allclose(np.linalg.norm(vectors,axis=1),1,atol=1e-4)
 assert set(p['id'] for p in labels if p['id'])==set(range(1,1026))
 print(prefix,len(labels),'unit vectors; all 1025 species represented')
