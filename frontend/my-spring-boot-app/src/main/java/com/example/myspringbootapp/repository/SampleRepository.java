import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.myspringbootapp.model.SampleEntity;

@Repository
public interface SampleRepository extends JpaRepository<SampleEntity, Long> {
    // Additional query methods can be defined here
}