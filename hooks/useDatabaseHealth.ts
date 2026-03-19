import { useEffect, useState } from "react";
import { doc, onSnapshot } from 'firebase/firestore';
import {db} from "@/lib/firebaseConfig";

interface HealthData {
    status: string;
    avgLatencyMs: number;
    activeUsers: number;
    lastCheck: any;
}

export const useDatabaseHealth = () => {
    const [data, setData] = useState<HealthData | null>(null);
    useEffect(() => {
    const docRef = doc(db,'admin_metrics', 'app_status');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if(snapshot.exists()) {
        setData(snapshot.data() as HealthData);
      }
    }, (error) => {
      console.error("Error listening to health metrics: ", error);
    });

    return () => unsubscribe();
  }, []);

    return data;
}